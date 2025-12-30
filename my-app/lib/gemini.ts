import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.5-flash-preview-05-20";

// Gemini 클라이언트 생성
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

// JSON 추출 함수 - 응답에서 유효한 JSON만 추출
export function extractJSON(text: string): object {
  // 먼저 전체 텍스트가 JSON인지 확인
  try {
    return JSON.parse(text);
  } catch {
    // JSON 블록을 찾아서 추출 (```json ... ``` 형식 포함)
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      try {
        return JSON.parse(jsonBlockMatch[1].trim());
      } catch {
        // 계속 시도
      }
    }

    // 일반 JSON 객체 추출
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

// 기본 콘텐츠 생성
export async function generateContent(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const ai = getGeminiClient();

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n---\n\n${prompt}`
    : prompt;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: fullPrompt,
  });

  return response.text || "";
}

// 뉴스 요약 기능
export interface SummarizeResult {
  headline: string;
  bullets: string[];
  insight: string;
  category: string;
  wowFactor?: {
    description: string;
    suggestedMedia: string;
  };
}

export async function summarizeNews(
  title: string,
  content: string
): Promise<SummarizeResult> {
  const ai = getGeminiClient();

  const systemPrompt = `당신은 AI/테크 분야의 전문 콘텐츠 라이터입니다. 뉴스를 읽고 독자들이 "이게 왜 중요하지?"라는 질문에 답할 수 있도록 핵심을 정리합니다.

당신의 글쓰기 스타일:
- 무엇이 공개/발표되었는지 명확하게 설명
- 기존과 무엇이 달라지는지 비교
- 업계/사용자에게 미치는 실질적 임팩트 분석
- 전문 용어는 쉽게 풀어서 설명

반드시 유효한 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`;

  const userPrompt = `다음 뉴스를 콘텐츠 라이터 관점에서 정리해주세요:

제목: ${title}
내용: ${content.substring(0, 3000)}

다음 JSON 형식으로 응답해주세요:
{
  "headline": "한 줄로 핵심을 담은 제목 (20-40자)",
  "bullets": [
    "첫 번째 포인트: 무엇이 어떻게 공개/변경되었는지 구체적으로 (40-60자)",
    "두 번째 포인트: 기존 대비 무엇이 달라지고 왜 주목할 만한지 (40-60자)",
    "세 번째 포인트: 사용자/업계에 미치는 실질적 영향과 의미 (40-60자)"
  ],
  "insight": "왜 이 뉴스가 중요한지 한 문장으로 (50-80자)",
  "category": "product|update|research|announcement|other 중 하나",
  "wowFactor": {
    "description": "이 뉴스에서 가장 주목할 만한 포인트 (30-50자)",
    "suggestedMedia": "이 뉴스를 시각화할 때 추천하는 미디어 유형 (예: 제품 스크린샷, 비교 차트, 인포그래픽 등)"
  }
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${systemPrompt}\n\n---\n\n${userPrompt}`,
    config: {
      temperature: 0.6,
    },
  });

  const result = extractJSON(response.text || "{}") as SummarizeResult;

  // 기본값 설정
  if (!result.headline) {
    result.headline = title;
  }
  if (!result.bullets || result.bullets.length === 0) {
    result.bullets = [
      `${title}에 대한 요약입니다.`,
      "자세한 내용은 원문을 확인하세요.",
      "추가 정보가 제공되지 않았습니다.",
    ];
  }
  if (!result.insight) {
    result.insight = "자세한 내용은 원문을 확인해주세요.";
  }
  if (!result.category) {
    result.category = "other";
  }

  return result;
}

// 플랫폼별 콘텐츠 생성
export interface PlatformContentResult {
  content: string;
  charCount: number;
  hashtags?: string[];
}

export async function generatePlatformContent(
  title: string,
  content: string,
  platform: string,
  styleTemplate?: {
    tone?: string;
    characteristics?: string[];
    examples?: string[];
  },
  url?: string
): Promise<PlatformContentResult> {
  const ai = getGeminiClient();

  const platformConfigs: Record<
    string,
    { maxLength: number; description: string }
  > = {
    twitter: {
      maxLength: 280,
      description: "X(트위터) - 짧고 임팩트있게, 해시태그 1-2개",
    },
    threads: {
      maxLength: 500,
      description: "Threads - 캐주얼하면서 정보성있게",
    },
    instagram: {
      maxLength: 2200,
      description: "Instagram - 이모지 활용, 해시태그 5-10개",
    },
    linkedin: {
      maxLength: 3000,
      description: "LinkedIn - 전문적이고 인사이트있게",
    },
  };

  const config = platformConfigs[platform];
  if (!config) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  // 문체 템플릿 프롬프트 구성
  let stylePrompt = "";
  if (styleTemplate) {
    if (styleTemplate.tone) {
      stylePrompt += `\n\n문체 톤: ${styleTemplate.tone}`;
    }
    if (styleTemplate.characteristics?.length) {
      stylePrompt += `\n스타일 특성: ${styleTemplate.characteristics.join(", ")}`;
    }
    if (styleTemplate.examples?.length) {
      stylePrompt += `\n\n참고할 예시 글:\n${styleTemplate.examples.map((e, i) => `${i + 1}. ${e}`).join("\n")}`;
    }
  }

  const systemPrompt = `당신은 소셜 미디어 콘텐츠 작성 전문가입니다. 주어진 뉴스를 ${config.description}에 맞게 한국어로 작성합니다.${stylePrompt} 반드시 유효한 JSON 형식으로만 응답하세요.`;

  const userPrompt = `다음 뉴스를 ${platform} 포스트로 작성해주세요:

제목: ${title}
내용: ${content}
${url ? `원문 링크: ${url}` : ""}

글자수 제한: ${config.maxLength}자

다음 JSON 형식으로 응답해주세요:
{
  "content": "포스트 내용",
  "charCount": 글자수${platform === "instagram" ? ',\n  "hashtags": ["해시태그", "배열"]' : ""}
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${systemPrompt}\n\n---\n\n${userPrompt}`,
    config: {
      temperature: 0.7,
    },
  });

  const result = extractJSON(response.text || "{}") as PlatformContentResult;

  // 기본값 설정
  if (!result.content) {
    result.content = `${title}\n\n자세한 내용은 원문을 확인하세요.`;
  }
  if (!result.charCount) {
    result.charCount = result.content.length;
  }

  return result;
}

// 문체 분석
export interface StyleAnalysisResult {
  tone: string;
  characteristics: string[];
}

export async function analyzeStyle(
  examples: string[]
): Promise<StyleAnalysisResult> {
  const ai = getGeminiClient();

  const systemPrompt = `당신은 문체 분석 전문가입니다. 주어진 예시 텍스트들의 공통된 문체 특성을 분석합니다. 반드시 유효한 JSON 형식으로만 응답하세요.`;

  const userPrompt = `다음 예시 텍스트들의 문체를 분석해주세요:

${examples.map((e, i) => `예시 ${i + 1}:\n${e}`).join("\n\n")}

다음 JSON 형식으로 응답해주세요:
{
  "tone": "문체의 전반적인 톤을 한 문장으로 설명 (예: 전문적이면서 친근한 톤, 간결하고 임팩트있는 스타일)",
  "characteristics": [
    "특성1 (예: 이모지 자주 사용)",
    "특성2 (예: 질문으로 시작)",
    "특성3 (예: 해시태그 많이 활용)",
    "특성4"
  ]
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${systemPrompt}\n\n---\n\n${userPrompt}`,
    config: {
      temperature: 0.5,
    },
  });

  const result = extractJSON(response.text || "{}") as StyleAnalysisResult;

  // 기본값 설정
  if (!result.tone) {
    result.tone = "분석 결과를 도출할 수 없습니다.";
  }
  if (!result.characteristics) {
    result.characteristics = [];
  }

  return result;
}

// 콘텐츠 재생성
export async function regenerateContent(
  previousContent: string,
  feedback: string,
  platform: string
): Promise<PlatformContentResult> {
  const ai = getGeminiClient();

  const platformConfigs: Record<string, { maxLength: number }> = {
    twitter: { maxLength: 280 },
    threads: { maxLength: 500 },
    instagram: { maxLength: 2200 },
    linkedin: { maxLength: 3000 },
  };

  const config = platformConfigs[platform];

  const systemPrompt = `당신은 소셜 미디어 콘텐츠 작성 전문가입니다. 피드백을 반영하여 콘텐츠를 개선합니다. 반드시 유효한 JSON 형식으로만 응답하세요.`;

  const userPrompt = `다음 콘텐츠를 피드백에 맞게 수정해주세요:

원본 콘텐츠:
${previousContent}

피드백: ${feedback}

글자수 제한: ${config?.maxLength || 500}자

다음 JSON 형식으로 응답해주세요:
{
  "content": "수정된 포스트 내용",
  "charCount": 글자수
}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${systemPrompt}\n\n---\n\n${userPrompt}`,
    config: {
      temperature: 0.7,
    },
  });

  const result = extractJSON(response.text || "{}") as PlatformContentResult;

  // 기본값 설정
  if (!result.content) {
    result.content = previousContent;
  }
  if (!result.charCount) {
    result.charCount = result.content.length;
  }

  return result;
}

// 번역 기능
export interface TranslateResult {
  title: string;
  content: string;
  isTranslated: boolean;
}

export async function translateContent(
  title: string,
  content: string
): Promise<TranslateResult> {
  const ai = getGeminiClient();

  const trimmedContent = content.trim();
  if (trimmedContent.length < 20) {
    return {
      title: title || "",
      content: trimmedContent,
      isTranslated: false,
    };
  }

  const systemPrompt = `당신은 전문 번역가입니다. 원문을 한국어로 **충실하게 직역**합니다.

## 핵심 원칙
- **절대 요약하지 않습니다** - 원문의 모든 내용을 빠짐없이 번역
- **원문 구조 유지** - 문단, 순서, 흐름을 원문 그대로 유지
- **추가/삭제 금지** - 원문에 없는 내용 추가 금지, 원문 내용 생략 금지
- **끝까지 번역** - 중간에 멈추지 말고 원문 전체를 완전히 번역

## 번역 스타일
- 기술 용어는 영어 유지 (API, GPU, LLM, AI, ML 등)
- 자연스러운 한국어 문장으로 번역하되 의미 변형 금지
- 고유명사(회사명, 제품명, 인명)는 원문 유지

## 출력 포맷 (Markdown)
- 섹션 제목은 ## 또는 ### 헤딩 사용
- 문단 사이 빈 줄로 구분
- 리스트는 - 또는 1. 2. 3. 형식
- 중요 키워드는 **볼드** 처리
- 인용문은 > 사용
- 코드나 기술 용어는 \`backtick\` 사용`;

  const userPrompt = `다음 기사를 한국어로 번역해주세요. 요약하지 말고 원문 전체를 끝까지 충실히 번역하세요.

${title ? `## ${title}\n\n` : ""}${trimmedContent.substring(0, 12000)}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `${systemPrompt}\n\n---\n\n${userPrompt}`,
    config: {
      temperature: 0.2,
    },
  });

  const translatedContent = response.text || trimmedContent;

  return {
    title: title || "",
    content: translatedContent,
    isTranslated: true,
  };
}
