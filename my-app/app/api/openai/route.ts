import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// DeepSeek 클라이언트 생성
function getAIClient(): OpenAI {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is not configured');
  }
  return new OpenAI({
    apiKey,
    baseURL: 'https://api.deepseek.com/v1',
  });
}

const MODEL = 'deepseek-reasoner';

type Mode = 'summarize' | 'generate' | 'analyze-style' | 'regenerate';

interface RequestBody {
  mode: Mode;
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

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();
    const { mode } = body;

    const ai = getAIClient();

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
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `당신은 AI/테크 분야의 전문 콘텐츠 라이터입니다. 뉴스를 읽고 독자들이 "이게 왜 중요하지?"라는 질문에 답할 수 있도록 핵심을 정리합니다.

당신의 글쓰기 스타일:
- 무엇이 공개/발표되었는지 명확하게 설명
- 기존과 무엇이 달라지는지 비교
- 업계/사용자에게 미치는 실질적 임팩트 분석
- 전문 용어는 쉽게 풀어서 설명

반드시 유효한 JSON 형식으로만 응답하세요.`,
          },
          {
            role: 'user',
            content: `다음 뉴스를 콘텐츠 라이터 관점에서 정리해주세요:

제목: ${title}
내용: ${content}

다음 JSON 형식으로 응답해주세요:
{
  "bullets": [
    "첫 번째 포인트: 무엇이 어떻게 공개/변경되었는지 구체적으로 (40-60자)",
    "두 번째 포인트: 기존 대비 무엇이 달라지고 왜 주목할 만한지 (40-60자)",
    "세 번째 포인트: 사용자/업계에 미치는 실질적 영향과 의미 (40-60자)"
  ],
  "category": "product|update|research|announcement|other 중 하나"
}

작성 가이드:
- 각 bullet은 완결된 문장으로, 콘텐츠 글처럼 자연스럽게 작성
- 단순 요약이 아닌 "그래서 이게 왜 중요해?"에 답하는 내용
- 숫자, 비교, 구체적 사례를 활용해 임팩트를 전달
- 독자가 이 뉴스의 가치를 바로 파악할 수 있도록`,
          },
        ],
        temperature: 0.6,
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
        model: MODEL,
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
        model: MODEL,
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
        model: MODEL,
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
