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

    const systemPrompt = `당신은 하버드 비즈니스 리뷰, 이코노미스트 수준의 고급 테크 저널리스트입니다.
뉴스의 본질을 꿰뚫어 **품격 있으면서도 읽고 싶게 만드는 헤드라인**을 작성합니다.

## 헤드라인 철학
- 자극적이지 않지만 지적 호기심을 자극
- "이게 뭐지?" 보다 "왜 이게 중요하지?"를 유발
- 클릭베이트가 아닌, 읽을 가치를 암시

## 작성 규칙
1. **간결함**: 2줄 이하, 줄당 10~15자
2. **핵심 통찰**: 무엇이 바뀌는지, 왜 주목해야 하는지
3. **구체적 팩트**: 모호한 과장 대신 명확한 정보
4. **품격 있는 톤**: "충격", "대박", "역대급" 금지
5. **지적 궁금증**: 결론 대신 질문을 던지거나, 의미를 암시

## 좋은 예시
- "GPT-5, 추론 능력의\\n새로운 기준을 세우다"
- "애플이 AI에\\n3년 늦은 진짜 이유"
- "코딩의 종말?\\n개발자가 살아남는 법"

## 피해야 할 스타일
- ❌ "충격! OpenAI 대반전"
- ❌ "역대급 발표에 업계 발칵"
- ❌ "드디어 공개된 비밀"

## 출력 형식
반드시 JSON만 출력:
{
  "main": "메인 헤드라인 (가장 품격 있고 궁금증 유발)",
  "alternatives": ["대안1", "대안2", "대안3"]
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
