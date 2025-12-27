import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured');
  }
  return new OpenAI({ apiKey });
}

const SYSTEM_PROMPT = `당신은 AI 기술 뉴스를 한국어로 요약하고, 소셜 미디어 플랫폼에 맞게 포맷팅하는 전문가입니다.

다음 규칙을 따르세요:
1. 모든 내용은 한국어로 작성합니다
2. 기술 용어는 적절히 번역하되, 널리 사용되는 영문 용어는 그대로 사용해도 됩니다
3. 각 플랫폼의 특성에 맞게 톤과 길이를 조절합니다
4. 핵심 정보를 명확하게 전달합니다`;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key is not configured' },
        { status: 500 }
      );
    }

    const { title, content, url, platform, customPrompt } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    // Single platform regeneration
    if (platform) {
      const platformPrompts: Record<string, string> = {
        twitter: `다음 뉴스를 X(트위터)에 올릴 280자 이내의 한국어 포스트로 작성해주세요. 핵심만 간결하게, 해시태그 1-2개 포함.`,
        threads: `다음 뉴스를 Threads에 올릴 500자 이내의 한국어 포스트로 작성해주세요. 캐주얼하면서도 정보성 있게.`,
        instagram: `다음 뉴스를 Instagram 캡션으로 작성해주세요. 한국어로 작성하고, 이모지를 적절히 활용하며, 관련 해시태그 5-10개를 포함해주세요.`,
        linkedin: `다음 뉴스를 LinkedIn 포스트로 작성해주세요. 전문적이고 인사이트를 담아 한국어로 작성해주세요.`,
      };

      const prompt = customPrompt || platformPrompts[platform];

      const openai = getOpenAIClient();
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: `${prompt}\n\n제목: ${title}\n내용: ${content}\n원문 링크: ${url}`,
          },
        ],
        temperature: 0.7,
      });

      return NextResponse.json({
        content: completion.choices[0].message.content,
      });
    }

    // Full processing for all platforms
    const openai = getOpenAIClient();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `다음 AI 기술 뉴스를 분석하고 가공해주세요:

제목: ${title}
내용: ${content}
원문 링크: ${url}

다음 JSON 형식으로 응답해주세요:
{
  "summary": "3-5문장의 한국어 요약",
  "platforms": {
    "twitter": {
      "content": "280자 이내의 X(트위터) 포스트. 해시태그 1-2개 포함",
      "charCount": 숫자
    },
    "threads": {
      "content": "500자 이내의 Threads 포스트"
    },
    "instagram": {
      "content": "Instagram 캡션",
      "hashtags": ["해시태그", "배열"]
    },
    "linkedin": {
      "content": "전문적인 LinkedIn 포스트"
    }
  }
}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json(result);
  } catch (error) {
    console.error('OpenAI error:', error);
    return NextResponse.json(
      { error: 'Failed to process with AI' },
      { status: 500 }
    );
  }
}
