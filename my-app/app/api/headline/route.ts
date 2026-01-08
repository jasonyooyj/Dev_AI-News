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

    const systemPrompt = `당신은 바이럴 테크 콘텐츠 전문가입니다.
뉴스의 본질을 꿰뚫어 **스크롤을 멈추게 하는 헤드라인**을 작성합니다.

## 4가지 헤드라인 스타일

### 1. insight (통찰형)
- 품격 있으면서 "왜 이게 중요하지?"를 유발
- 핵심 의미나 영향을 암시
- 예시:
  - "GPT-5, 추론 능력의\\n새로운 기준을 세우다"
  - "오픈AI의 다음 수\\n구글이 두려운 이유"
  - "테슬라 로보택시\\n자율주행의 분기점"

### 2. hook (훅형)
- 정보 갭으로 강한 호기심 유발
- "이것", 숫자, 대비를 활용한 긴장감
- 예시:
  - "개발자 90%가 모르는\\nAI 코딩의 함정"
  - "이 코드 한 줄이\\n당신의 서버를 날린다"
  - "GPT-5 발표 후\\n빅테크가 침묵한 이유"

### 3. story (스토리형)
- 변화/결과를 드라마틱하게 전달
- 전후 대비, 성장 서사 활용
- 예시:
  - "월 $20로 시작해\\nARR $1M 달성한 법"
  - "실패한 스타트업이\\n유니콘이 되기까지"
  - "3개월 만에 MAU 100만\\n그들이 한 단 한 가지"

### 4. question (질문형)
- 본질적 질문으로 생각을 촉발
- 결론 대신 열린 질문
- 예시:
  - "AI가 코딩을 대체하면\\n개발자는 뭘 하나?"
  - "빅테크가 오픈소스에\\n집착하는 진짜 속내?"
  - "애플이 AI에 늦은\\n진짜 이유는?"

## Hook 엔지니어링 기법
- **Bold Statement**: 예상을 뒤엎는 주장
- **Tension**: 독자의 고민/문제 공감
- **Twist**: 반전으로 흥미 유발
- **Credibility**: 구체적 숫자/사례로 신뢰 부여

## 작성 규칙
1. **간결함**: 2줄 이하, 줄당 8~15자
2. **구체성**: "이것", 숫자, 고유명사 활용
3. **정보 갭**: 다 알려주지 말고 암시
4. **금지어**: "충격", "대박", "역대급", "발칵", "경악"
5. **줄바꿈**: \\n으로 리듬감 있게

## 출력 규칙
- main: 뉴스에 가장 적합한 스타일로 작성
- alternatives: 나머지 3가지 스타일로 각각 작성

## 출력 형식 (JSON만 출력)
{
  "main": "가장 효과적인 헤드라인",
  "alternatives": ["다른스타일1", "다른스타일2", "다른스타일3"]
}`;

    const userPrompt = `다음 뉴스에 대한 카드뉴스 표지용 헤드라인을 작성해주세요:

제목: ${title}
${content ? `내용: ${content.slice(0, 1000)}` : ""}

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
