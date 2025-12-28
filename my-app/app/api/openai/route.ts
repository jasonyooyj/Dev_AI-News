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

const MODEL = 'deepseek-chat'; // deepseek-reasoner 대신 더 안정적인 chat 모델 사용

// JSON 추출 함수 - 응답에서 유효한 JSON만 추출
function extractJSON(text: string): object {
  // 먼저 전체 텍스트가 JSON인지 확인
  try {
    return JSON.parse(text);
  } catch {
    // JSON 블록을 찾아서 추출
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // JSON 파싱 실패 시 기본값 반환
      }
    }
  }
  return {};
}

type Mode = 'summarize' | 'generate' | 'analyze-style' | 'regenerate' | 'translate';

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

      // 빈 content나 너무 짧은 content 처리
      if (!title) {
        return NextResponse.json(
          { error: 'Title is required for summarize mode' },
          { status: 400 }
        );
      }

      // content가 없거나 너무 짧으면 기본 요약 반환
      const trimmedContent = (content || '').trim();
      if (trimmedContent.length < 50) {
        return NextResponse.json({
          bullets: [
            `${title} - 자세한 내용은 원문을 확인하세요.`,
            '추가 정보가 필요합니다.',
            '원문 링크에서 전체 내용을 확인할 수 있습니다.'
          ],
          category: 'other'
        });
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

반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`,
          },
          {
            role: 'user',
            content: `다음 뉴스를 콘텐츠 라이터 관점에서 정리해주세요:

제목: ${title}
내용: ${trimmedContent.substring(0, 3000)}

다음 JSON 형식으로 응답해주세요:
{
  "bullets": [
    "첫 번째 포인트: 무엇이 어떻게 공개/변경되었는지 구체적으로 (40-60자)",
    "두 번째 포인트: 기존 대비 무엇이 달라지고 왜 주목할 만한지 (40-60자)",
    "세 번째 포인트: 사용자/업계에 미치는 실질적 영향과 의미 (40-60자)"
  ],
  "category": "product|update|research|announcement|other 중 하나"
}`,
          },
        ],
        temperature: 0.6,
      });

      const responseText = completion.choices[0].message.content || '{}';
      const result = extractJSON(responseText);

      // bullets가 없으면 기본값 설정
      if (!result || !(result as {bullets?: string[]}).bullets) {
        return NextResponse.json({
          bullets: [`${title}에 대한 요약입니다.`, '자세한 내용은 원문을 확인하세요.', '추가 정보가 제공되지 않았습니다.'],
          category: 'other'
        });
      }

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

      const responseText = completion.choices[0].message.content || '{}';
      const result = extractJSON(responseText);
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

      const responseText = completion.choices[0].message.content || '{}';
      const result = extractJSON(responseText);
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

      const responseText = completion.choices[0].message.content || '{}';
      const result = extractJSON(responseText);
      return NextResponse.json(result);
    }

    // === MODE: translate ===
    // 기사 원문 번역 (요약 금지, 원문 충실 번역)
    if (mode === 'translate') {
      const { title, content } = body;

      if (!content) {
        return NextResponse.json(
          { error: 'Content is required for translate mode' },
          { status: 400 }
        );
      }

      // 콘텐츠가 너무 짧으면 그대로 반환
      const trimmedContent = content.trim();
      if (trimmedContent.length < 20) {
        return NextResponse.json({
          title: title || '',
          content: trimmedContent,
          isTranslated: false,
        });
      }

      const completion = await ai.chat.completions.create({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `당신은 전문 번역가입니다. 원문을 한국어로 **충실하게 직역**합니다.

## 핵심 원칙
- **절대 요약하지 않습니다** - 원문의 모든 내용을 빠짐없이 번역
- **원문 구조 유지** - 문단, 순서, 흐름을 원문 그대로 유지
- **추가/삭제 금지** - 원문에 없는 내용 추가 금지, 원문 내용 생략 금지

## 번역 스타일
- 기술 용어는 영어 유지 (API, GPU, LLM, AI, ML 등)
- 자연스러운 한국어 문장으로 번역하되 의미 변형 금지
- 고유명사(회사명, 제품명, 인명)는 원문 유지

## 출력 포맷 (Markdown)
- 제목이 있으면 ## 헤딩 사용
- 문단 사이 빈 줄로 구분
- 리스트는 - 또는 1. 2. 3. 형식
- 중요 키워드는 **볼드** 처리
- 인용문은 > 사용
- 코드나 기술 용어는 \`backtick\` 사용`,
          },
          {
            role: 'user',
            content: `다음 기사를 한국어로 번역해주세요. 요약하지 말고 원문 전체를 충실히 번역하세요.

${title ? `## ${title}\n\n` : ''}${trimmedContent.substring(0, 10000)}`,
          },
        ],
        temperature: 0.2,
      });

      const translatedContent = completion.choices[0].message.content || trimmedContent;

      return NextResponse.json({
        title: title || '',
        content: translatedContent,
        isTranslated: true,
      });
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
