export interface BrandSettings {
  brandName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
  logoColor: string;
  gradientStartColor: string;
  gradientEndColor: string;
  gradientDirection: string;
}

export interface ThumbnailOptions {
  title: string;
  subtitle: string;
  style: "Minimal" | "Bold" | "Cinematic" | "Gradient";
  size: "1280x720" | "400x225" | "1080x1080";
}

// Reduced sizes to keep localStorage under quota (JPEG output)
const SIZE_MAP: Record<string, [number, number]> = {
  "1280x720": [640, 360],
  "400x225": [400, 225],
  "1080x1080": [400, 400],
};

const DIRECTION_MAP: Record<string, [number, number, number, number]> = {
  "to right": [0, 0, 1, 0],
  "to left": [1, 0, 0, 0],
  "to bottom": [0, 0, 0, 1],
  "to top": [0, 1, 0, 0],
  diagonal: [0, 0, 1, 1],
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function generateThumbnail(
  brand: BrandSettings,
  options: ThumbnailOptions
): string {
  const [w, h] = SIZE_MAP[options.size] || [1280, 720];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  // Background
  const dirs = DIRECTION_MAP[brand.gradientDirection] || [0, 0, 1, 1];
  const grad = ctx.createLinearGradient(
    dirs[0] * w,
    dirs[1] * h,
    dirs[2] * w,
    dirs[3] * h
  );

  if (options.style === "Gradient") {
    grad.addColorStop(0, brand.gradientStartColor);
    grad.addColorStop(1, brand.gradientEndColor);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (options.style === "Cinematic") {
    ctx.fillStyle = "#0a0a1a";
    ctx.fillRect(0, 0, w, h);
    // Cinematic bars
    grad.addColorStop(0, hexToRgba(brand.primaryColor, 0.4));
    grad.addColorStop(0.5, "transparent");
    grad.addColorStop(1, hexToRgba(brand.secondaryColor, 0.4));
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    // Vignette
    const vg = ctx.createRadialGradient(w / 2, h / 2, w * 0.2, w / 2, h / 2, w * 0.7);
    vg.addColorStop(0, "transparent");
    vg.addColorStop(1, "rgba(0,0,0,0.6)");
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, w, h);
  } else if (options.style === "Bold") {
    ctx.fillStyle = brand.primaryColor;
    ctx.fillRect(0, 0, w, h);
    // Diagonal accent strip
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(w * 0.6, 0);
    ctx.lineTo(w, 0);
    ctx.lineTo(w, h);
    ctx.lineTo(w * 0.4, h);
    ctx.closePath();
    ctx.fillStyle = brand.accentColor;
    ctx.fill();
    ctx.restore();
  } else {
    // Minimal
    ctx.fillStyle = "#0f0f1a";
    ctx.fillRect(0, 0, w, h);
    // Subtle bottom accent line
    ctx.fillStyle = brand.primaryColor;
    ctx.fillRect(0, h - 6, w, 6);
  }

  // Overlay for text readability
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(0, 0, w, h);

  // Title
  const titleSize = Math.round(w * 0.06);
  ctx.font = `bold ${titleSize}px Merriweather, serif`;
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const titleY = options.subtitle ? h * 0.42 : h * 0.5;
  wrapText(ctx, options.title, w / 2, titleY, w * 0.8, titleSize * 1.3);

  // Subtitle
  if (options.subtitle) {
    const subSize = Math.round(w * 0.03);
    ctx.font = `${subSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.fillText(options.subtitle, w / 2, h * 0.6, w * 0.8);
  }

  // Brand name watermark
  if (brand.brandName) {
    const wmSize = Math.round(w * 0.018);
    ctx.font = `600 ${wmSize}px sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.textAlign = "right";
    ctx.fillText(brand.brandName, w - 24, h - 20);
  }

  return canvas.toDataURL("image/jpeg", 0.7);
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];

  for (const word of words) {
    const test = line + (line ? " " : "") + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);

  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, startY + i * lineHeight, maxWidth);
  }
}
