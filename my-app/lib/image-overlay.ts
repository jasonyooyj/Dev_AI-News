import sharp from "sharp";
import path from "path";
import fs from "fs";

// 폰트 파일 경로
const FONT_DIR = path.join(process.cwd(), "public", "fonts");
const PRETENDARD_BOLD = path.join(FONT_DIR, "Pretendard-Bold.otf");
const PRETENDARD_SEMIBOLD = path.join(FONT_DIR, "Pretendard-SemiBold.otf");

// 폰트를 base64로 로드
function loadFontAsBase64(fontPath: string): string | null {
  try {
    const fontBuffer = fs.readFileSync(fontPath);
    return fontBuffer.toString("base64");
  } catch {
    console.warn(`폰트 파일을 찾을 수 없습니다: ${fontPath}`);
    return null;
  }
}

// 텍스트를 줄바꿈하는 함수
function wrapText(text: string, maxCharsPerLine: number): string[] {
  const lines: string[] = [];
  let currentLine = "";

  // 한글, 영어, 숫자, 특수문자를 고려한 줄바꿈
  for (const char of text) {
    currentLine += char;

    // 한글은 2바이트, 영어/숫자는 1바이트로 계산
    const charWidth = /[\u3131-\uD79D]/.test(char) ? 2 : 1;
    const lineWidth = [...currentLine].reduce((acc, c) => {
      return acc + (/[\u3131-\uD79D]/.test(c) ? 2 : 1);
    }, 0);

    if (lineWidth >= maxCharsPerLine * 2) {
      lines.push(currentLine);
      currentLine = "";
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 3); // 최대 3줄
}

// XML 특수문자 이스케이프
function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

interface OverlayOptions {
  headline: string;
  width: number;
  height: number;
  fontSize?: number;
  textColor?: string;
  backgroundColor?: string;
  padding?: number;
  position?: "top" | "center" | "bottom";
}

// 이미지에 헤드라인 텍스트 오버레이
export async function addHeadlineToImage(
  imageBase64: string,
  options: OverlayOptions
): Promise<Buffer> {
  const {
    headline,
    width,
    height,
    fontSize = 48,
    textColor = "#FFFFFF",
    backgroundColor = "rgba(0, 0, 0, 0.6)",
    padding = 40,
    position = "top",
  } = options;

  // 폰트 로드
  const fontBase64 = loadFontAsBase64(PRETENDARD_BOLD);
  const fontFaceRule = fontBase64
    ? `@font-face {
        font-family: 'Pretendard';
        src: url(data:font/opentype;base64,${fontBase64}) format('opentype');
        font-weight: bold;
      }`
    : "";

  // 줄바꿈 처리 (width에 따라 글자 수 조절)
  const maxCharsPerLine = Math.floor((width - padding * 2) / (fontSize * 0.6));
  const lines = wrapText(headline, maxCharsPerLine);

  // 텍스트 영역 높이 계산
  const lineHeight = fontSize * 1.4;
  const textBlockHeight = lines.length * lineHeight + padding * 2;

  // 위치에 따른 Y 좌표 계산
  let bgY = 0;
  if (position === "center") {
    bgY = (height - textBlockHeight) / 2;
  } else if (position === "bottom") {
    bgY = height - textBlockHeight;
  }

  // 텍스트 SVG 생성
  const textElements = lines
    .map((line, index) => {
      const y = bgY + padding + fontSize + index * lineHeight;
      return `<text x="${padding}" y="${y}" class="headline">${escapeXml(line)}</text>`;
    })
    .join("\n");

  const svgOverlay = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style type="text/css">
          ${fontFaceRule}
          .headline {
            font-family: 'Pretendard', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
            font-size: ${fontSize}px;
            font-weight: bold;
            fill: ${textColor};
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
        </style>
        <linearGradient id="textBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:${backgroundColor}"/>
          <stop offset="100%" style="stop-color:rgba(0,0,0,0)"/>
        </linearGradient>
      </defs>

      <!-- 텍스트 배경 그라데이션 -->
      <rect x="0" y="${bgY}" width="${width}" height="${textBlockHeight + 40}" fill="url(#textBg)"/>

      <!-- 헤드라인 텍스트 -->
      ${textElements}
    </svg>
  `;

  // Base64 이미지를 버퍼로 변환
  const imageBuffer = Buffer.from(imageBase64, "base64");

  // Sharp로 이미지 합성
  const result = await sharp(imageBuffer)
    .resize(width, height, { fit: "cover" })
    .composite([
      {
        input: Buffer.from(svgOverlay),
        top: 0,
        left: 0,
      },
    ])
    .png()
    .toBuffer();

  return result;
}

// 플랫폼별 이미지 사이즈 가져오기
export function getPlatformImageSize(
  platform: string,
  aspectRatio: string
): { width: number; height: number } {
  const sizes: Record<string, Record<string, { width: number; height: number }>> = {
    twitter: {
      "16:9": { width: 1200, height: 675 },
      "1:1": { width: 1080, height: 1080 },
      "4:5": { width: 1080, height: 1350 },
    },
    threads: {
      "4:5": { width: 1080, height: 1350 },
      "1:1": { width: 1080, height: 1080 },
      "9:16": { width: 1080, height: 1920 },
    },
    instagram: {
      "4:5": { width: 1080, height: 1350 },
      "1:1": { width: 1080, height: 1080 },
      "9:16": { width: 1080, height: 1920 },
    },
    linkedin: {
      "1.91:1": { width: 1200, height: 627 },
      "1:1": { width: 1200, height: 1200 },
      "16:9": { width: 1920, height: 1080 },
    },
    bluesky: {
      "16:9": { width: 1200, height: 675 },
      "1:1": { width: 1080, height: 1080 },
    },
  };

  return sizes[platform]?.[aspectRatio] || { width: 1200, height: 675 };
}

// 최종 이미지 생성 (AI 배경 + 텍스트 오버레이)
export async function createFinalImage(
  backgroundBase64: string,
  headline: string,
  platform: string,
  aspectRatio: string
): Promise<{ base64: string; mimeType: string }> {
  const size = getPlatformImageSize(platform, aspectRatio);

  // 폰트 크기를 이미지 크기에 맞게 조절
  const fontSize = Math.floor(size.width / 20);

  const resultBuffer = await addHeadlineToImage(backgroundBase64, {
    headline,
    width: size.width,
    height: size.height,
    fontSize,
    position: "top",
  });

  return {
    base64: resultBuffer.toString("base64"),
    mimeType: "image/png",
  };
}
