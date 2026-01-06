import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3-flash-preview";
const IMAGE_MODEL = "gemini-3-pro-image-preview"; // nano-banana-3-pro

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

  const systemPrompt = `당신은 AI/ML/LLM 분야 전문 테크 콘텐츠 라이터입니다. AI 관련 뉴스를 읽고 독자들이 "이게 왜 중요하지?"라는 질문에 답할 수 있도록 핵심을 정리합니다.

## 콘텍스트
- 이 뉴스는 AI, 머신러닝, LLM, 생성형 AI 관련 소식입니다
- 독자는 AI/테크에 관심있는 한국어 사용자입니다

## 글쓰기 스타일
- 무엇이 공개/발표되었는지 명확하게 설명
- 기존과 무엇이 달라지는지 비교
- 업계/사용자에게 미치는 실질적 임팩트 분석
- 전문 용어는 쉽게 풀어서 설명

## 중요: 고유명사 처리
- 회사명, 제품명, 모델명, 인명은 **원문 그대로 유지** (번역 금지)
- 예시: OpenAI, Claude, GPT-4, Gemini, Meta, Google, Anthropic, Llama, Mistral, Sam Altman 등
- 기술 용어도 원문 유지: API, GPU, TPU, transformer, fine-tuning, RAG, embedding 등

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
  url?: string,
  sourceName?: string
): Promise<PlatformContentResult> {
  const ai = getGeminiClient();

  const platformConfigs: Record<
    string,
    { maxLength: number; description: string; style: string }
  > = {
    twitter: {
      maxLength: 280,
      description: "X(트위터)",
      style: "핵심만 간결하게. 해시태그 1-2개.",
    },
    threads: {
      maxLength: 500,
      description: "Threads",
      style: "정보 중심으로 깔끔하게 정리.",
    },
    instagram: {
      maxLength: 2200,
      description: "Instagram",
      style: "읽기 쉽게 정리. 해시태그는 맨 마지막에.",
    },
    linkedin: {
      maxLength: 3000,
      description: "LinkedIn",
      style: "전문적이고 깔끔하게. 인사이트 포함.",
    },
  };

  const config = platformConfigs[platform];
  if (!config) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  const systemPrompt = `테크 뉴스를 소셜 미디어용으로 정리합니다.

## 작성 스타일
- 정보 전달 중심, 군더더기 없이
- 이모지는 필요할때 포인트에만 적절히
${sourceName ? `- 마지막에 "출처: ${sourceName}" 추가` : ""}

## 규칙
1. 팩트 중심 (숫자, 이름, 사실관계 정확히)
2. ${Math.floor(config.maxLength * 0.5)}~${Math.floor(config.maxLength * 0.8)}자
3. 고유명사 원문 유지
4. ${config.style}

JSON으로만 응답.`;

  const userPrompt = `이 뉴스를 ${config.description} 포스트로 바꿔줘:

제목: ${title}
내용: ${content}
${url ? `링크: ${url}` : ""}

{
  "content": "포스트 내용",
  "charCount": 글자수${platform === "instagram" ? ',\n  "hashtags": ["해시태그들"]' : ""}
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
  const maxLength = config?.maxLength || 500;

  const systemPrompt = `피드백 반영해서 콘텐츠 수정해줘.

## 스타일
- 2-3문장을 한 문단으로, 문단 사이 줄바꿈
- 이모지는 문장 중간중간에 자연스럽게 (끝에만 몰아넣지 말 것)

글자수 ${Math.floor(maxLength * 0.5)}~${Math.floor(maxLength * 0.8)}자. JSON으로만 응답.`;

  const userPrompt = `원본:
${previousContent}

피드백: ${feedback}

{
  "content": "수정된 내용",
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

  const systemPrompt = `당신은 AI/테크 분야 전문 번역가입니다. 원문을 한국어로 **충실하게 직역**합니다.

## 콘텍스트
- 이 기사는 AI, 머신러닝, LLM, 생성형 AI 관련 테크 뉴스입니다
- 독자는 AI/테크에 관심있는 한국어 사용자입니다

## 핵심 원칙
- **절대 요약하지 않습니다** - 원문의 모든 내용을 빠짐없이 번역
- **원문 구조 유지** - 문단, 순서, 흐름을 원문 그대로 유지
- **추가/삭제 금지** - 원문에 없는 내용 추가 금지, 원문 내용 생략 금지
- **끝까지 번역** - 중간에 멈추지 말고 원문 전체를 완전히 번역

## 중요: 고유명사 처리 (번역 금지)
- **회사명**: OpenAI, Anthropic, Google, Meta, Microsoft, NVIDIA, xAI, Mistral AI, Cohere, Hugging Face 등
- **제품/모델명**: GPT-4, Claude, Gemini, Llama, Mistral, Grok, DALL-E, Midjourney, Stable Diffusion 등
- **인명**: Sam Altman, Dario Amodei, Demis Hassabis, Yann LeCun, Andrej Karpathy 등
- **기술 용어**: API, GPU, TPU, transformer, fine-tuning, RAG, embedding, inference, token, context window, RLHF, LoRA 등

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

// 이미지 생성 결과 타입
export interface ImageGenerationResult {
  base64: string;
  mimeType: string;
  description?: string;
}

// Aspect ratio를 Gemini API 형식으로 변환
function convertAspectRatio(aspectRatio: string): string {
  const ratioMap: Record<string, string> = {
    "16:9": "16:9",
    "1:1": "1:1",
    "4:5": "4:5",
    "9:16": "9:16",
    "1.91:1": "16:9", // LinkedIn 근사치
    "4:3": "4:3",
    "3:4": "3:4",
  };
  return ratioMap[aspectRatio] || "1:1";
}

// 기사 내용 분석하여 이미지 프롬프트 생성
async function analyzeContentForImage(
  headline: string,
  summary: string
): Promise<string> {
  const ai = getGeminiClient();

  const analysisPrompt = `You are an expert at creating image generation prompts for news article backgrounds.

Analyze this news headline and summary, then create a specific image prompt for a BACKGROUND image.

Headline: ${headline}
Summary: ${summary}

IMPORTANT: This image will have text overlaid later. Generate a CLEAN background only.

Rules:
1. If a specific PERSON is the focus (CEO, researcher, etc.):
   - Professional portrait, centered composition
   - Leave some space at top for text overlay

2. If a COMPANY/BRAND is the focus (OpenAI, Google, Meta, etc.):
   - Feature their recognizable logo or brand colors
   - Modern, clean tech environment

3. If a PRODUCT/TECHNOLOGY is the focus:
   - Clean product visualization
   - Professional aesthetic

4. If it's an ABSTRACT CONCEPT (AI trend, market analysis, etc.):
   - Symbolic imagery, data visualizations, conceptual art
   - Modern, professional aesthetic

Output ONLY the image description in English. Be specific about:
- Main subject (centered, not at the very top)
- Environment/background
- Lighting and mood
- Colors (prefer darker/muted tones for text readability)

DO NOT include any text or typography in the image.
Keep it under 80 words. No explanations, just the prompt.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: analysisPrompt,
    config: {
      temperature: 0.7,
    },
  });

  return response.text || "Modern tech workspace with abstract data visualization, dark ambient lighting";
}

// AI 뉴스 이미지 생성 (기사 내용 기반 동적 프롬프트)
export async function generateNewsImage(
  headline: string,
  summary: string,
  _platform: string,
  aspectRatio: string = "9:16"
): Promise<ImageGenerationResult> {
  const ai = getGeminiClient();

  // 1단계: 기사 내용 분석하여 이미지 설명 생성
  const imageDescription = await analyzeContentForImage(headline, summary);

  // 2단계: 깔끔한 배경 이미지 생성 (텍스트 없이)
  const prompt = `Create a professional background image for a social media news card.

SCENE TO GENERATE:
${imageDescription}

CRITICAL RULES:
- DO NOT include ANY text, typography, letters, or words in the image
- DO NOT add blur zones, vignettes, or special overlay areas
- Generate a CLEAN, full-frame image that fills the entire canvas
- The image should work as a background for text overlay

Technical specifications:
- DSLR quality, 50mm lens, shallow depth of field
- Professional lighting with slight film color grading
- Prefer darker or muted tones for better text readability
- Clean composition, subject can be centered or slightly lower

Style: Photorealistic, modern, professional tech/news aesthetic.
NO TEXT OR TYPOGRAPHY ANYWHERE IN THE IMAGE.`;

  const geminiAspectRatio = convertAspectRatio(aspectRatio);

  const response = await ai.models.generateContent({
    model: IMAGE_MODEL,
    contents: prompt,
    config: {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio: geminiAspectRatio,
        imageSize: "2K",
      },
    },
  });

  // 응답에서 이미지 추출
  let base64 = "";
  let mimeType = "image/png";
  let description = "";

  if (response.candidates && response.candidates[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData && part.inlineData.data) {
        base64 = part.inlineData.data;
        mimeType = part.inlineData.mimeType || "image/png";
      }
      if (part.text) {
        description = part.text;
      }
    }
  }

  if (!base64) {
    throw new Error("이미지 생성에 실패했습니다. 응답에 이미지가 없습니다.");
  }

  return {
    base64,
    mimeType,
    description,
  };
}
