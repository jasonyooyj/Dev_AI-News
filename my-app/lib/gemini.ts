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

// 플랫폼별 설정
const platformConfigs: Record<
  string,
  { maxLength: number; description: string; style: string }
> = {
  twitter: {
    maxLength: 280,
    description: "X(트위터)",
    style: `## 핵심
- 한 문장으로 임팩트 있게
- 숫자/팩트로 관심 유발
- 이모지 1-2개만

## 해시태그
- 1-2개 최대
- 본문에 자연스럽게 포함`,
  },
  threads: {
    maxLength: 500,
    description: "Threads",
    style: `## 톤
- 대화체, 친근하게
- 의견/인사이트 포함 가능

## 구조
- 2-3문단으로 정보 전달
- 문단 사이 줄바꿈
- 질문으로 마무리해 댓글 유도
- 해시태그 불필요 (선택적)`,
  },
  instagram: {
    maxLength: 2200,
    description: "Instagram",
    style: `## 훅 라인 (첫 줄이 핵심!)
- 피드에서 "...더 보기" 전에 보이는 유일한 텍스트
- 호기심 유발/충격적 사실/질문 형식
- 예: "이거 진짜 게임체인저입니다 🔥"

## 구조
1. 훅 라인 (1줄)
2. [빈 줄]
3. 핵심 내용 (1-2문단, 각 1-2문장)
4. [빈 줄]
5. 인사이트/시사점
6. [빈 줄]
7. CTA: "저장해두세요 💾" 또는 "여러분 생각은? 💬"

## 포맷
- 문단 = 1-2문장, 최대 3줄
- 문단 사이 빈 줄 필수 (모바일 가독성)
- 이모지: 문장 시작/중간에 자연스럽게 (끝에 몰아넣기 금지)
- 전체 이모지 5-8개`,
  },
  linkedin: {
    maxLength: 3000,
    description: "LinkedIn",
    style: `## 톤
- 전문적, 인사이트 중심
- 업계 영향 분석 포함

## 구조
1. 핵심 소식 (1-2문장)
2. [빈 줄]
3. 왜 중요한지 (2-3문단)
4. [빈 줄]
5. 시사점/전망
6. (선택) 의견 요청

## 포맷
- 짧은 문단
- 이모지 최소화 (0-3개)
- 해시태그 3-5개 (전문적)`,
  },
};

// Instagram 전용 시스템 프롬프트
function getInstagramSystemPrompt(sourceName?: string): string {
  return `Instagram 테크 콘텐츠 크리에이터입니다.

## 훅 라인 작성법 (가장 중요!)
피드에서 "...더 보기" 전에 보이는 첫 줄이 클릭을 결정합니다.
- 호기심 자극: "이거 알고 계셨나요? 🤔"
- 충격적 사실: "GPT-4가 드디어 128K 토큰을 지원합니다"
- 가치 제안: "개발자라면 꼭 알아야 할 소식"
- 감정 유발: "이 소식 보고 소름 돋았습니다 😱"

## 모바일 가독성
- 한 문단 = 1-2문장 (최대 3줄)
- 문단 사이 빈 줄로 구분 (필수!)
- 스크롤하며 쉽게 읽히도록

## 이모지 사용법
- 문장 시작 또는 중간에 자연스럽게
- 끝에 몰아넣지 않기
- 전체 5-8개 적정

## CTA (마지막에 하나 선택)
- "저장해두면 나중에 유용해요 💾"
- "여러분 생각은? 댓글로 알려주세요 💬"
- "알려주고 싶은 친구 태그 👇"

## 규칙
1. 글자수: 1100~1760자 (해시태그 제외)
2. 고유명사 원문 유지 (OpenAI, GPT-4, Claude 등)
3. 팩트 중심, 과장 금지
${sourceName ? `4. 마지막에 "출처: ${sourceName}" 추가` : ""}

JSON으로만 응답.`;
}

// Instagram 전용 유저 프롬프트
function getInstagramUserPrompt(
  title: string,
  content: string,
  url?: string
): string {
  return `다음 AI/테크 뉴스를 Instagram 캡션으로 변환해주세요:

제목: ${title}
내용: ${content}
${url ? `링크: ${url}` : ""}

## 응답 형식
{
  "content": "캡션 (훅 라인으로 시작, 줄바꿈 포함, CTA 포함)",
  "charCount": 글자수,
  "hashtags": ["해시태그들 8-15개"]
}

## 해시태그 구성 (8-15개)
- 대중적 (3-4개): AI, Tech, Innovation, MachineLearning
- 전문적 (3-4개): LLM, GPT, GenAI, MLOps, RAG
- 한국어 (2-3개): 인공지능, 테크뉴스, AI소식, 딥러닝
- 주제 관련 (2-3개): 뉴스 내용에 맞게`;
}

export async function generatePlatformContent(
  title: string,
  content: string,
  platform: string,
  url?: string,
  sourceName?: string
): Promise<PlatformContentResult> {
  const ai = getGeminiClient();

  const config = platformConfigs[platform];
  if (!config) {
    throw new Error(`Invalid platform: ${platform}`);
  }

  let systemPrompt: string;
  let userPrompt: string;

  if (platform === "instagram") {
    // Instagram 전용 프롬프트
    systemPrompt = getInstagramSystemPrompt(sourceName);
    userPrompt = getInstagramUserPrompt(title, content, url);
  } else {
    // 다른 플랫폼용 공통 프롬프트 (개선된 style 포함)
    systemPrompt = `테크 뉴스를 소셜 미디어용으로 정리합니다.

## 작성 스타일
- 정보 전달 중심, 군더더기 없이
- 이모지는 필요할때 포인트에만 적절히
${sourceName ? `- 마지막에 "출처: ${sourceName}" 추가` : ""}

## 규칙
1. 팩트 중심 (숫자, 이름, 사실관계 정확히)
2. ${Math.floor(config.maxLength * 0.5)}~${Math.floor(config.maxLength * 0.8)}자
3. 고유명사 원문 유지

## ${config.description} 가이드라인
${config.style}

JSON으로만 응답.`;

    userPrompt = `이 뉴스를 ${config.description} 포스트로 바꿔줘:

제목: ${title}
내용: ${content}
${url ? `링크: ${url}` : ""}

{
  "content": "포스트 내용",
  "charCount": 글자수
}`;
  }

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

  const config = platformConfigs[platform];
  const maxLength = config?.maxLength || 500;
  const description = config?.description || platform;

  // 플랫폼별 스타일 가이드
  const platformStyleGuide =
    platform === "instagram"
      ? `## Instagram 스타일
- 훅 라인으로 시작 (호기심 유발)
- 문단 사이 빈 줄 필수
- 이모지는 문장 중간에 자연스럽게 (끝에 몰아넣기 금지)
- 마지막에 CTA 포함 ("저장해두세요 💾" 등)`
      : platform === "twitter"
        ? `## X(트위터) 스타일
- 한 문장으로 임팩트 있게
- 이모지 1-2개만
- 해시태그 1-2개`
        : platform === "threads"
          ? `## Threads 스타일
- 대화체, 친근하게
- 2-3문단으로 정보 전달
- 질문으로 마무리`
          : platform === "linkedin"
            ? `## LinkedIn 스타일
- 전문적, 인사이트 중심
- 짧은 문단
- 이모지 최소화`
            : `## 기본 스타일
- 2-3문장을 한 문단으로
- 이모지는 문장 중간에 자연스럽게`;

  const systemPrompt = `피드백 반영해서 ${description} 콘텐츠를 수정해줘.

${platformStyleGuide}

글자수 ${Math.floor(maxLength * 0.5)}~${Math.floor(maxLength * 0.8)}자. JSON으로만 응답.`;

  const userPrompt = `원본:
${previousContent}

피드백: ${feedback}

{
  "content": "수정된 내용",
  "charCount": 글자수${platform === "instagram" ? ',\n  "hashtags": ["기존 해시태그 유지 또는 수정"]' : ""}
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

// AI 뉴스 이미지 생성 (헤드라인 텍스트 포함)
export async function generateNewsImage(
  headline: string,
  summary: string,
  _platform: string,
  aspectRatio: string = "9:16"
): Promise<ImageGenerationResult> {
  const ai = getGeminiClient();

  // 1단계: 기사 내용 분석하여 이미지 설명 생성
  const imageDescription = await analyzeContentForImage(headline, summary);

  // 2단계: 헤드라인 텍스트가 포함된 뉴스 카드 이미지 생성
  const prompt = `Create a professional social media news card image with the following Korean headline text displayed prominently.

HEADLINE TEXT TO DISPLAY (must appear exactly as written):
"${headline}"

BACKGROUND SCENE:
${imageDescription}

DESIGN REQUIREMENTS:
1. TEXT STYLING:
   - Display the headline text in clean, modern sans-serif font (like Pretendard or similar)
   - Text color: WHITE with subtle drop shadow for readability
   - Text position: TOP area of the image (upper 30%)
   - Text size: Large and prominent, easy to read
   - Line breaks: Keep natural line breaks if present in the headline

2. BACKGROUND:
   - The scene described above should fill the entire canvas
   - Apply a subtle dark gradient overlay at the top for text readability
   - DSLR quality, professional lighting
   - Darker or muted tones work best

3. COMPOSITION:
   - Clean, modern, professional news card aesthetic
   - The headline must be the focal point and clearly readable
   - Background should complement, not compete with the text

CRITICAL: The Korean headline text MUST be rendered correctly and be clearly readable.`;

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
