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

    const systemPrompt = `당신은 한국 카드뉴스 전문 에디터입니다. 뉴스의 핵심 정보를 추출해 **자극적인 한국식 카드뉴스 표지 헤드라인**을 작성합니다.

## 헤드라인 작성 규칙
1. **짧고 자극적**: 2줄 이하, 줄당 10~12자 이내
2. **숫자·비유·비교 활용**: "3배 빨라진", "업계 최초", "역대급" 등
3. **반전·긴장감 요소**: "그런데...", "하지만", "충격" 등
4. **감정 자극 단어**: "드디어", "결국", "대박", "논란", "충격", "반전" 등
5. **사건·인물 중심**: 주체와 행동을 명확히
6. **불완전 문장 허용**: "~한 이유", "~의 정체", "~하더니" 등
7. **외국 기사는 한국식으로**: 한국 언론 스타일로 재구성

## 출력 형식
- 메인 헤드라인 1개 (가장 자극적인 버전)
- 대안 헤드라인 3개 (다른 각도/스타일)
- 각 헤드라인은 줄바꿈 포함 가능 (\\n으로 표시)

반드시 JSON 형식으로만 응답:
{
  "main": "메인 헤드라인",
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
