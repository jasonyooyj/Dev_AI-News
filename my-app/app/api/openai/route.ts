import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

type AIProvider = 'openai' | 'deepseek';

interface ProviderConfig {
  client: OpenAI;
  model: string;
  supportsJsonMode: boolean;
}

function getAIClient(provider?: AIProvider): ProviderConfig {
  const selectedProvider = provider || (process.env.AI_PROVIDER as AIProvider) || 'openai';

  if (selectedProvider === 'deepseek') {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('DEEPSEEK_API_KEY is not configured');
    }
    return {
      client: new OpenAI({
        apiKey,
        baseURL: 'https://api.deepseek.com/v1',
      }),
      model: 'deepseek-chat',
      supportsJsonMode: false, // DeepSeek doesn't support response_format
    };
  }

  // Default: OpenAI
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return {
    client: new OpenAI({ apiKey }),
    model: 'gpt-4o-mini',
    supportsJsonMode: true,
  };
}

type Mode = 'summarize' | 'generate' | 'analyze-style' | 'regenerate';

interface RequestBody {
  mode: Mode;
  provider?: AIProvider;
  // summarize
  title?: string;
  content?: string;
  // generate
  platform?: string;
  styleTemplate?: {
    tone?: string;
    characteristics?: string[];
    examples?: string[];
  };
  url?: string;
  // analyze-style
  examples?: string[];
  // regenerate
  previousContent?: string;
  feedback?: string;
}

// GET endpoint to check available providers
export async function GET() {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const defaultProvider = (process.env.AI_PROVIDER as AIProvider) || 'openai';

  return NextResponse.json({
    providers: {
      openai: hasOpenAI,
      deepseek: hasDeepSeek,
    },
    defaultProvider: hasOpenAI || hasDeepSeek ? defaultProvider : null,
    models: {
      openai: 'gpt-4o-mini',
      deepseek: 'deepseek-chat',
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mode, provider } = body;

    // Check if at least one provider is configured
    const hasOpenAI = !!process.env.OPENAI_API_KEY;
    const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;

    if (!hasOpenAI && !hasDeepSeek) {
      return NextResponse.json(
        { error: 'No AI provider API key is configured. Please set OPENAI_API_KEY or DEEPSEEK_API_KEY.' },
        { status: 500 }
      );
    }

    // Get the AI client based on provider preference
    let aiConfig: ProviderConfig;
    try {
      aiConfig = getAIClient(provider);
    } catch {
      // Fallback to available provider
      if (hasDeepSeek) {
        aiConfig = getAIClient('deepseek');
      } else {
        aiConfig = getAIClient('openai');
      }
    }

    const { client: ai, model, supportsJsonMode } = aiConfig;

    // === MODE: summarize ===
    // 뉴스 수집 시 3줄 핵심 요약 생성
    if (mode === 'summarize') {
      const { title, content } = body;

      if (!title || !content) {
        return NextResponse.json(
          { error: 'Title and content are required for summarize mode' },
          { status: 400 }
        );
      }

      const completion = await ai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `당신은 AI 기술 뉴스를 분석하는 전문가입니다. 뉴스의 핵심 포인트를 추출하고 카테고리를 분류합니다. 반드시 유효한 JSON 형식으로만 응답하세요.`,
          },
          {
            role: 'user',
            content: `다음 뉴스를 분석해주세요:

제목: ${title}
내용: ${content}

다음 JSON 형식으로 응답해주세요:
{
  "bullets": [
    "핵심 포인트 1 (20-30자)",
    "핵심 포인트 2 (20-30자)",
    "핵심 포인트 3 (20-30자)"
  ],
  "category": "product|update|research|announcement|other 중 하나"
}

각 bullet은 한국어로 작성하고, 뉴스의 가장 중요한 정보를 담아주세요.`,
          },
        ],
        temperature: 0.5,
        ...(supportsJsonMode && { response_format: { type: 'json_object' as const } }),
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return NextResponse.json(result);
    }

    // === MODE: generate ===
    // 특정 플랫폼용 콘텐츠 생성 (문체 템플릿 적용)
    if (mode === 'generate') {
      const { title, content, platform, styleTemplate, url } = body;

      if (!title || !content || !platform) {
        return NextResponse.json(
          { error: 'Title, content, and platform are required for generate mode' },
          { status: 400 }
        );
      }

      const platformConfigs: Record<string, { maxLength: number; description: string }> = {
        twitter: { maxLength: 280, description: 'X(트위터) - 짧고 임팩트있게, 해시태그 1-2개' },
        threads: { maxLength: 500, description: 'Threads - 캐주얼하면서 정보성있게' },
        instagram: { maxLength: 2200, description: 'Instagram - 이모지 활용, 해시태그 5-10개' },
        linkedin: { maxLength: 3000, description: 'LinkedIn - 전문적이고 인사이트있게' },
      };

      const config = platformConfigs[platform];
      if (!config) {
        return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
      }

      // 문체 템플릿 프롬프트 구성
      let stylePrompt = '';
      if (styleTemplate) {
        if (styleTemplate.tone) {
          stylePrompt += `\n\n문체 톤: ${styleTemplate.tone}`;
        }
        if (styleTemplate.characteristics?.length) {
          stylePrompt += `\n스타일 특성: ${styleTemplate.characteristics.join(', ')}`;
        }
        if (styleTemplate.examples?.length) {
          stylePrompt += `\n\n참고할 예시 글:\n${styleTemplate.examples.map((e, i) => `${i + 1}. ${e}`).join('\n')}`;
        }
      }

      const completion = await ai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `당신은 소셜 미디어 콘텐츠 작성 전문가입니다. 주어진 뉴스를 ${config.description}에 맞게 한국어로 작성합니다.${stylePrompt} 반드시 유효한 JSON 형식으로만 응답하세요.`,
          },
          {
            role: 'user',
            content: `다음 뉴스를 ${platform} 포스트로 작성해주세요:

제목: ${title}
내용: ${content}
${url ? `원문 링크: ${url}` : ''}

글자수 제한: ${config.maxLength}자

다음 JSON 형식으로 응답해주세요:
{
  "content": "포스트 내용",
  "charCount": 글자수,
  ${platform === 'instagram' ? '"hashtags": ["해시태그", "배열"],' : ''}
}`,
          },
        ],
        temperature: 0.7,
        ...(supportsJsonMode && { response_format: { type: 'json_object' as const } }),
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return NextResponse.json(result);
    }

    // === MODE: analyze-style ===
    // 예시 텍스트에서 문체 분석
    if (mode === 'analyze-style') {
      const { examples } = body;

      if (!examples || examples.length === 0) {
        return NextResponse.json(
          { error: 'Examples are required for analyze-style mode' },
          { status: 400 }
        );
      }

      const completion = await ai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `당신은 문체 분석 전문가입니다. 주어진 예시 텍스트들의 공통된 문체 특성을 분석합니다. 반드시 유효한 JSON 형식으로만 응답하세요.`,
          },
          {
            role: 'user',
            content: `다음 예시 텍스트들의 문체를 분석해주세요:

${examples.map((e, i) => `예시 ${i + 1}:\n${e}`).join('\n\n')}

다음 JSON 형식으로 응답해주세요:
{
  "tone": "문체의 전반적인 톤을 한 문장으로 설명 (예: 전문적이면서 친근한 톤, 간결하고 임팩트있는 스타일)",
  "characteristics": [
    "특성1 (예: 이모지 자주 사용)",
    "특성2 (예: 질문으로 시작)",
    "특성3 (예: 해시태그 많이 활용)",
    "특성4"
  ]
}`,
          },
        ],
        temperature: 0.5,
        ...(supportsJsonMode && { response_format: { type: 'json_object' as const } }),
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return NextResponse.json(result);
    }

    // === MODE: regenerate ===
    // 피드백을 반영하여 콘텐츠 재생성
    if (mode === 'regenerate') {
      const { previousContent, feedback, platform } = body;

      if (!previousContent || !feedback || !platform) {
        return NextResponse.json(
          { error: 'previousContent, feedback, and platform are required for regenerate mode' },
          { status: 400 }
        );
      }

      const platformConfigs: Record<string, { maxLength: number }> = {
        twitter: { maxLength: 280 },
        threads: { maxLength: 500 },
        instagram: { maxLength: 2200 },
        linkedin: { maxLength: 3000 },
      };

      const config = platformConfigs[platform];

      const completion = await ai.chat.completions.create({
        model,
        messages: [
          {
            role: 'system',
            content: `당신은 소셜 미디어 콘텐츠 작성 전문가입니다. 피드백을 반영하여 콘텐츠를 개선합니다. 반드시 유효한 JSON 형식으로만 응답하세요.`,
          },
          {
            role: 'user',
            content: `다음 콘텐츠를 피드백에 맞게 수정해주세요:

원본 콘텐츠:
${previousContent}

피드백: ${feedback}

글자수 제한: ${config?.maxLength || 500}자

다음 JSON 형식으로 응답해주세요:
{
  "content": "수정된 포스트 내용",
  "charCount": 글자수
}`,
          },
        ],
        temperature: 0.7,
        ...(supportsJsonMode && { response_format: { type: 'json_object' as const } }),
      });

      const result = JSON.parse(completion.choices[0].message.content || '{}');
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400 });
  } catch (error) {
    console.error('AI API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to process with AI: ${errorMessage}` },
      { status: 500 }
    );
  }
}
