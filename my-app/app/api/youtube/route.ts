import { NextRequest, NextResponse } from 'next/server';

// YouTube URL에서 video ID 추출
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // 직접 ID 입력
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  return null;
}

// 영상 메타데이터 가져오기 (oEmbed API + 페이지 스크래핑)
async function getVideoMetadata(videoId: string): Promise<{
  title: string;
  description: string;
  thumbnail: string;
  channelName: string;
  duration: string;
}> {
  try {
    // 1. oEmbed API로 기본 정보 가져오기
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const oembedRes = await fetch(oembedUrl);

    let title = '';
    let channelName = '';

    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      title = oembedData.title || '';
      channelName = oembedData.author_name || '';
    }

    // 2. 영상 페이지에서 추가 정보 스크래핑
    let description = '';
    let duration = '';

    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
        },
      });

      if (pageRes.ok) {
        const html = await pageRes.text();

        // 제목 추출 (fallback)
        if (!title) {
          const titleMatch = html.match(/<meta name="title" content="([^"]+)"/);
          if (titleMatch) {
            title = titleMatch[1];
          }
        }

        // 설명 추출
        const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
        if (descMatch) {
          description = descMatch[1];
        }

        // duration 추출 (ISO 8601 형식)
        const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
        if (durationMatch) {
          const seconds = parseInt(durationMatch[1], 10);
          const hours = Math.floor(seconds / 3600);
          const minutes = Math.floor((seconds % 3600) / 60);
          const secs = seconds % 60;

          if (hours > 0) {
            duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
          } else {
            duration = `${minutes}:${secs.toString().padStart(2, '0')}`;
          }
        }

        // 채널명 추출 (fallback)
        if (!channelName) {
          const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
          if (channelMatch) {
            channelName = channelMatch[1];
          }
        }
      }
    } catch {
      // 페이지 스크래핑 실패 시 무시
    }

    // 썸네일 URL (고화질)
    const thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    return {
      title: title || 'Unknown Title',
      description: description || '',
      thumbnail,
      channelName: channelName || 'Unknown Channel',
      duration: duration || '',
    };
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    return {
      title: 'Unknown Title',
      description: '',
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      channelName: 'Unknown Channel',
      duration: '',
    };
  }
}

// 자막 트랙 타입
interface SubtitleTrack {
  baseUrl: string;
  languageCode: string;
  kind?: string; // 'asr' for auto-generated
}

// YouTube 자막 추출 (직접 구현 - youtube-transcript 대체)
async function fetchTranscript(videoId: string): Promise<string> {
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  // 영상 페이지 가져오기
  const pageRes = await fetch(watchUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!pageRes.ok) {
    throw new Error(`Failed to fetch video page: ${pageRes.status}`);
  }

  const html = await pageRes.text();

  // captions 정보 추출
  const captionsMatch = html.match(/"captions":\s*(\{[^}]+playerCaptionsTracklistRenderer[^}]+\})/);
  if (!captionsMatch) {
    // 대체 패턴 시도
    const altMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
    if (!altMatch) {
      throw new Error('NO_CAPTIONS');
    }

    try {
      const captionTracks: SubtitleTrack[] = JSON.parse(altMatch[1]);
      return await fetchSubtitleFromTracks(captionTracks);
    } catch {
      throw new Error('NO_CAPTIONS');
    }
  }

  // captionTracks 추출
  const tracksMatch = html.match(/"captionTracks":\s*(\[[^\]]+\])/);
  if (!tracksMatch) {
    throw new Error('NO_CAPTIONS');
  }

  let captionTracks: SubtitleTrack[];
  try {
    captionTracks = JSON.parse(tracksMatch[1]);
  } catch {
    throw new Error('Failed to parse caption tracks');
  }

  return await fetchSubtitleFromTracks(captionTracks);
}

// 자막 트랙에서 실제 자막 가져오기
async function fetchSubtitleFromTracks(captionTracks: SubtitleTrack[]): Promise<string> {
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error('NO_CAPTIONS');
  }

  // 언어 우선순위: 한국어 공식 > 영어 공식 > 한국어 자동생성 > 영어 자동생성 > 첫 번째
  const languagePriority = ['ko', 'en'];

  let selectedTrack: SubtitleTrack | null = null;

  // 1. 공식 자막 (kind가 없거나 'asr'이 아닌 것)
  for (const lang of languagePriority) {
    const track = captionTracks.find(
      t => t.languageCode === lang && t.kind !== 'asr'
    );
    if (track) {
      selectedTrack = track;
      break;
    }
  }

  // 2. 자동생성 자막
  if (!selectedTrack) {
    for (const lang of languagePriority) {
      const track = captionTracks.find(
        t => t.languageCode === lang && t.kind === 'asr'
      );
      if (track) {
        selectedTrack = track;
        break;
      }
    }
  }

  // 3. 첫 번째 자막
  if (!selectedTrack) {
    selectedTrack = captionTracks[0];
  }

  if (!selectedTrack || !selectedTrack.baseUrl) {
    throw new Error('NO_CAPTIONS');
  }

  // 자막 XML 가져오기 (fmt=json3 for JSON format)
  const subtitleUrl = selectedTrack.baseUrl + '&fmt=json3';
  const subRes = await fetch(subtitleUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  });

  if (!subRes.ok) {
    // JSON3 실패 시 일반 XML 시도
    const xmlRes = await fetch(selectedTrack.baseUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      },
    });

    if (!xmlRes.ok) {
      throw new Error(`Failed to fetch subtitles: ${xmlRes.status}`);
    }

    const xml = await xmlRes.text();
    return parseXmlSubtitles(xml);
  }

  const json = await subRes.json();
  return parseJson3Subtitles(json);
}

// JSON3 형식 자막 파싱
function parseJson3Subtitles(json: { events?: Array<{ segs?: Array<{ utf8?: string }> }> }): string {
  const events = json.events || [];
  const texts: string[] = [];

  for (const event of events) {
    if (event.segs) {
      const segText = event.segs
        .map(seg => seg.utf8 || '')
        .join('')
        .trim();
      if (segText) {
        texts.push(segText);
      }
    }
  }

  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

// XML 형식 자막 파싱
function parseXmlSubtitles(xml: string): string {
  // <text> 태그 내용 추출
  const textPattern = /<text[^>]*>([^<]*)<\/text>/g;
  const texts: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = textPattern.exec(xml)) !== null) {
    const text = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/\n/g, ' ')
      .trim();

    if (text) {
      texts.push(text);
    }
  }

  return texts.join(' ').replace(/\s+/g, ' ').trim();
}

export async function POST(request: NextRequest) {
  // Vercel 함수 타임아웃 고려 (50초로 설정)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL' },
        { status: 400 }
      );
    }

    // 병렬로 메타데이터와 자막 가져오기
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchTranscript(videoId).catch((error: Error) => {
        if (error.message === 'NO_CAPTIONS') {
          return null;
        }
        throw error;
      }),
    ]);

    clearTimeout(timeoutId);

    // 자막이 없는 경우
    if (transcript === null) {
      return NextResponse.json({
        title: metadata.title,
        description: metadata.description,
        transcript: null,
        thumbnail: metadata.thumbnail,
        duration: metadata.duration,
        channelName: metadata.channelName,
        error: 'This video does not have captions available',
      });
    }

    return NextResponse.json({
      title: metadata.title,
      description: metadata.description,
      transcript,
      thumbnail: metadata.thumbnail,
      duration: metadata.duration,
      channelName: metadata.channelName,
    });

  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'Request timeout - video processing took too long' },
        { status: 408 }
      );
    }

    console.error('YouTube API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to extract YouTube data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
