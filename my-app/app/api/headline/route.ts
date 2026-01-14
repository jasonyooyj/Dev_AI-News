import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-2.0-flash";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  return new GoogleGenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const { title, content } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    const systemPrompt = `당신은 10년차 테크 저널리스트이자 바이럴 콘텐츠 전문가입니다.
뉴스를 읽으면 **독자가 클릭할 수밖에 없는 핵심 포인트**를 본능적으로 캐치합니다.

## STEP 1: 뉴스 분석 (헤드라인 작성 전 반드시 수행)

다음 질문에 답하며 뉴스의 핵심을 파악하세요:

### 숫자/가격 체크
- 구체적인 숫자가 있는가? (가격, 할인율, 성능, 기간, 사용자 수)
- 비교할 수 있는 기준점이 있는가? (기존 가격, 경쟁사, 이전 버전)
- 예: "Pro 장비가 학생에게 50% 할인" → 숫자가 핵심

### 대상/타겟 체크
- 누구를 위한 것인가? 타겟이 바뀌었는가?
- 예상 밖의 대상인가? (전문가용 → 학생용, B2B → B2C)
- 예: "엔터프라이즈 AI가 개인에게 무료" → 대상 변화가 핵심

### 전후 비교 체크
- 이전과 무엇이 달라졌는가?
- 업계 관행을 깨는 것인가?
- 예: "애플이 가격을 낮췄다" → 평소와 다른 행보가 핵심

### 숨겨진 의미 체크
- 왜 이렇게 했을까? 배경/의도는?
- 업계에 미칠 파급효과는?
- 예: "오픈소스 공개" → 경쟁 구도 변화가 핵심

### 독자 임팩트 체크
- 내 독자(테크 관심층)에게 왜 중요한가?
- 당장 행동해야 하는가? (구매, 가입, 학습)

## STEP 2: 핵심 포인트 → 헤드라인 변환

분석에서 찾은 **가장 강력한 포인트 1개**를 선택하여 헤드라인화

### 변환 예시
| 뉴스 | 핵심 포인트 | 헤드라인 |
|------|------------|----------|
| 애플 Studio 학생 할인 출시 | 200만원 장비가 학생에겐 80만원 | "200만원 스튜디오가\\n학생에겐 80만원" |
| GPT-5 출시, 추론 2배 향상 | 경쟁사 대비 압도적 격차 | "GPT-5의 추론 능력\\n경쟁사가 2년 걸릴 수준" |
| 스타트업 A, 시리즈B 500억 | 6개월 만에 10배 성장 | "MAU 1만에서 100만\\n6개월의 비밀" |

## STEP 3: 4가지 스타일로 작성

1. **insight**: 품격 있게 의미 전달 ("새로운 기준을 세우다")
2. **hook**: 정보 갭으로 호기심 유발 ("90%가 모르는")
3. **story**: 변화/성장 드라마 ("~에서 ~까지")
4. **question**: 본질적 질문 ("왜 ~했을까?")

## 작성 규칙
- 2줄 이하, 줄당 8~15자, \\n으로 줄바꿈
- 분석에서 찾은 숫자/대상/비교를 반드시 활용
- 금지어: "충격", "대박", "역대급", "발칵", "경악"

## 출력 형식 (JSON만)
{
  "main": "가장 임팩트 있는 헤드라인 (분석에서 찾은 핵심 포인트 기반)",
  "alternatives": ["다른스타일1", "다른스타일2", "다른스타일3"]
}`;

    const userPrompt = `다음 뉴스를 분석하고 헤드라인을 작성해주세요.

## 뉴스
제목: ${title}
${content ? `내용: ${content.slice(0, 2000)}` : ""}

## 지시사항
1. STEP 1의 체크리스트로 뉴스를 분석하세요 (숫자, 대상, 비교, 숨겨진 의미)
2. 가장 강력한 포인트 1개를 선택하세요
3. 그 포인트를 기반으로 4가지 스타일의 헤드라인을 작성하세요

JSON만 출력하세요.`;

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `${systemPrompt}\n\n---\n\n${userPrompt}`,
    });

    const text = response.text || "";

    // Extract JSON from response
    let result;
    try {
      // Try parsing directly
      result = JSON.parse(text);
    } catch {
      // Try extracting JSON block
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Failed to parse AI response");
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Headline generation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate headline" },
      { status: 500 }
    );
  }
}
