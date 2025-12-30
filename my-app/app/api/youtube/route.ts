import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, unlink, readdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

const execAsync = promisify(exec);

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

// JSON3 자막 파싱
function parseJson3Subtitles(content: string): string {
  try {
    const json = JSON.parse(content);
    const events = json.events || [];
    const texts: string[] = [];

    for (const event of events) {
      if (event.segs) {
        const segText = event.segs
          .map((seg: { utf8?: string }) => seg.utf8 || '')
          .join('')
          .trim();
        if (segText && segText !== '\n') {
          texts.push(segText);
        }
      }
    }

    return texts.join(' ').replace(/\s+/g, ' ').trim();
  } catch (e) {
    console.error('[YouTube] JSON3 parse error:', e);
    return '';
  }
}

// yt-dlp로 자막 및 메타데이터 추출
async function fetchWithYtDlp(videoId: string): Promise<{
  title: string;
  description: string;
  channelName: string;
  duration: string;
  thumbnail: string;
  transcript: string | null;
}> {
  const tempDir = tmpdir();
  const timestamp = Date.now();
  const outputBase = join(tempDir, `yt_${videoId}_${timestamp}`);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  try {
    // 1. 메타데이터 가져오기 (쿠키 없이 - 더 안정적)
    console.log(`[YouTube] Fetching metadata for: ${videoId}`);

    const metadataCmd = `yt-dlp --skip-download --no-check-formats --ignore-errors --dump-json "${videoUrl}"`;

    const { stdout: metadataJson } = await execAsync(metadataCmd, {
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024, // 10MB
    });

    const metadata = JSON.parse(metadataJson);

    const title = metadata.title || 'Unknown Title';
    const description = metadata.description || '';
    const channelName = metadata.uploader || metadata.channel || 'Unknown Channel';
    const durationSeconds = metadata.duration || 0;

    // Duration 포맷팅
    let duration = '';
    if (durationSeconds > 0) {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const secs = durationSeconds % 60;
      if (hours > 0) {
        duration = `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      } else {
        duration = `${minutes}:${secs.toString().padStart(2, '0')}`;
      }
    }

    const thumbnail = metadata.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    console.log(`[YouTube] Video: ${title}, Duration: ${duration}`);

    // 2. 자막 다운로드 시도 (쿠키 없이 - 쿠키 사용 시 API 경로 문제 발생)
    console.log('[YouTube] Fetching subtitles...');

    // 자막 다운로드 명령 (쿠키 없이 실행 - 더 안정적)
    const subtitleCmd = `yt-dlp --skip-download --no-check-formats --ignore-errors --write-sub --write-auto-sub --sub-lang "ko,en" --sub-format json3 -o "${outputBase}" "${videoUrl}"`;

    try {
      await execAsync(subtitleCmd, {
        timeout: 60000,
        maxBuffer: 10 * 1024 * 1024,
      });
    } catch (e) {
      // 429 에러 등 발생해도 일부 파일은 다운로드됐을 수 있음
      const errMsg = e instanceof Error ? e.message.substring(0, 200) : 'Unknown';
      console.log('[YouTube] Subtitle command warning:', errMsg);
    }

    // 3. 다운로드된 자막 파일 찾기
    const files = await readdir(tempDir);
    const subtitleFiles = files.filter(f =>
      f.startsWith(`yt_${videoId}_${timestamp}`) && f.endsWith('.json3')
    );

    console.log(`[YouTube] Found subtitle files: ${subtitleFiles.length > 0 ? subtitleFiles.join(', ') : 'none'}`);

    let transcript: string | null = null;

    // 한국어 우선
    const koFile = subtitleFiles.find(f => f.includes('.ko.'));
    const enFile = subtitleFiles.find(f => f.includes('.en.'));

    const targetFile = koFile || enFile || subtitleFiles[0];

    if (targetFile) {
      const subtitlePath = join(tempDir, targetFile);
      const subtitleContent = await readFile(subtitlePath, 'utf-8');
      transcript = parseJson3Subtitles(subtitleContent);

      console.log(`[YouTube] Got transcript from ${targetFile}: ${transcript.length} chars`);

      // 파일 정리
      for (const f of subtitleFiles) {
        try {
          await unlink(join(tempDir, f));
        } catch {
          // 무시
        }
      }
    }

    return {
      title,
      description,
      channelName,
      duration,
      thumbnail,
      transcript,
    };
  } catch (error) {
    console.error('[YouTube] yt-dlp error:', error);

    // yt-dlp 실패 시 fallback으로 메타데이터만
    return await fetchMetadataOnly(videoId);
  }
}

// Fallback: yt-dlp 없을 때 메타데이터만 가져오기
async function fetchMetadataOnly(videoId: string): Promise<{
  title: string;
  description: string;
  channelName: string;
  duration: string;
  thumbnail: string;
  transcript: null;
}> {
  // oEmbed API
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
  const oembedRes = await fetch(oembedUrl);

  let title = 'Unknown Title';
  let channelName = 'Unknown Channel';

  if (oembedRes.ok) {
    const data = await oembedRes.json();
    title = data.title || title;
    channelName = data.author_name || channelName;
  }

  // 페이지에서 추가 정보
  let description = '';
  let duration = '';

  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      const descMatch = html.match(/<meta name="description" content="([^"]+)"/);
      if (descMatch) description = descMatch[1];

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
    }
  } catch {
    // 무시
  }

  return {
    title,
    description,
    channelName,
    duration,
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    transcript: null,
  };
}

// yt-dlp 설치 확인
async function checkYtDlp(): Promise<boolean> {
  try {
    await execAsync('which yt-dlp');
    return true;
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
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

    console.log(`[YouTube] Processing video: ${videoId}`);

    // yt-dlp 확인
    const hasYtDlp = await checkYtDlp();

    let result;
    if (hasYtDlp) {
      result = await fetchWithYtDlp(videoId);
    } else {
      console.log('[YouTube] yt-dlp not found, fetching metadata only');
      result = await fetchMetadataOnly(videoId);
    }

    if (result.transcript === null) {
      return NextResponse.json({
        ...result,
        error: hasYtDlp
          ? 'No subtitles available for this video'
          : 'yt-dlp not installed - transcript extraction not available',
      });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('[YouTube] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: `Failed to extract YouTube data: ${errorMessage}` },
      { status: 500 }
    );
  }
}
