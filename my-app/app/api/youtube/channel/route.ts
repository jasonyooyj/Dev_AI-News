import { NextRequest, NextResponse } from 'next/server';

// YouTube 채널 URL에서 채널 ID 또는 핸들 추출
function extractChannelInfo(url: string): { type: 'id' | 'handle' | 'user'; value: string } | null {
  const patterns = [
    { regex: /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/, type: 'id' as const },
    { regex: /youtube\.com\/@([a-zA-Z0-9_.-]+)/, type: 'handle' as const },
    { regex: /youtube\.com\/c\/([a-zA-Z0-9_-]+)/, type: 'user' as const },
    { regex: /youtube\.com\/user\/([a-zA-Z0-9_-]+)/, type: 'user' as const },
  ];

  for (const { regex, type } of patterns) {
    const match = url.match(regex);
    if (match) {
      return { type, value: match[1] };
    }
  }
  return null;
}

// 채널 핸들/이름에서 채널 ID 가져오기
async function getChannelId(channelInfo: { type: 'id' | 'handle' | 'user'; value: string }): Promise<string | null> {
  if (channelInfo.type === 'id') {
    return channelInfo.value;
  }

  try {
    // YouTube 페이지에서 채널 ID 추출
    let pageUrl: string;
    if (channelInfo.type === 'handle') {
      pageUrl = `https://www.youtube.com/@${channelInfo.value}`;
    } else {
      pageUrl = `https://www.youtube.com/c/${channelInfo.value}`;
    }

    console.log(`[YouTube Channel] Fetching page: ${pageUrl}`);

    const response = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      console.error(`[YouTube Channel] Failed to fetch page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    console.log(`[YouTube Channel] Got HTML: ${html.length} chars`);

    // 여러 패턴으로 채널 ID 추출 시도
    const patterns = [
      /"channelId":"(UC[a-zA-Z0-9_-]{22})"/,
      /channel_id=(UC[a-zA-Z0-9_-]{22})/,
      /"externalId":"(UC[a-zA-Z0-9_-]{22})"/,
      /\/channel\/(UC[a-zA-Z0-9_-]{22})/,
      /"browseId":"(UC[a-zA-Z0-9_-]{22})"/,
      /UC[a-zA-Z0-9_-]{22}/,  // 마지막 시도: 그냥 UC로 시작하는 22자 ID
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match) {
        const channelId = match[1] || match[0];
        if (channelId.startsWith('UC') && channelId.length === 24) {
          console.log(`[YouTube Channel] Found channel ID: ${channelId}`);
          return channelId;
        }
      }
    }

    console.error('[YouTube Channel] Could not find channel ID in page');
    return null;
  } catch (error) {
    console.error('[YouTube Channel] Error fetching channel page:', error);
    return null;
  }
}

// YouTube RSS 피드에서 비디오 목록 가져오기
async function fetchChannelVideos(channelId: string, limit: number = 10): Promise<{
  channelTitle: string;
  videos: Array<{
    videoId: string;
    title: string;
    link: string;
    description: string;
    publishedAt: string;
    thumbnail: string;
  }>;
}> {
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

  console.log(`[YouTube Channel] Fetching RSS: ${rssUrl}`);

  const response = await fetch(rssUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  }

  const xml = await response.text();

  // XML 파싱 (간단한 regex 기반)
  const channelTitleMatch = xml.match(/<title>([^<]+)<\/title>/);
  const channelTitle = channelTitleMatch ? channelTitleMatch[1] : 'Unknown Channel';

  const entries: Array<{
    videoId: string;
    title: string;
    link: string;
    description: string;
    publishedAt: string;
    thumbnail: string;
  }> = [];

  // entry 태그들 추출
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;

  while ((match = entryRegex.exec(xml)) !== null && entries.length < limit) {
    const entry = match[1];

    const videoIdMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
    const linkMatch = entry.match(/<link rel="alternate" href="([^"]+)"/);
    const publishedMatch = entry.match(/<published>([^<]+)<\/published>/);
    const descriptionMatch = entry.match(/<media:description>([^<]*)<\/media:description>/);

    if (videoIdMatch && titleMatch) {
      const videoId = videoIdMatch[1];
      entries.push({
        videoId,
        title: decodeXmlEntities(titleMatch[1]),
        link: linkMatch ? linkMatch[1] : `https://www.youtube.com/watch?v=${videoId}`,
        description: descriptionMatch ? decodeXmlEntities(descriptionMatch[1]) : '',
        publishedAt: publishedMatch ? publishedMatch[1] : new Date().toISOString(),
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      });
    }
  }

  return {
    channelTitle,
    videos: entries,
  };
}

// XML 엔티티 디코딩
function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

export async function POST(request: NextRequest) {
  try {
    const { url, limit = 10 } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log(`[YouTube Channel] Processing: ${url}`);

    // 채널 정보 추출
    const channelInfo = extractChannelInfo(url);
    if (!channelInfo) {
      return NextResponse.json(
        { error: 'Invalid YouTube channel URL' },
        { status: 400 }
      );
    }

    console.log(`[YouTube Channel] Extracted: ${channelInfo.type} = ${channelInfo.value}`);

    // 채널 ID 가져오기
    const channelId = await getChannelId(channelInfo);
    if (!channelId) {
      return NextResponse.json(
        { error: 'Could not resolve channel ID' },
        { status: 400 }
      );
    }

    // 비디오 목록 가져오기
    const result = await fetchChannelVideos(channelId, limit);

    console.log(`[YouTube Channel] Found ${result.videos.length} videos from ${result.channelTitle}`);

    return NextResponse.json({
      channelId,
      channelTitle: result.channelTitle,
      videos: result.videos,
      videosCount: result.videos.length,
    });

  } catch (error) {
    console.error('[YouTube Channel] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to fetch YouTube channel: ${errorMessage}` },
      { status: 500 }
    );
  }
}
