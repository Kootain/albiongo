// ─── Canvas 底层绘图原语 ──────────────────────────────────────────────────────────
// 无任何游戏业务含义，仅封装 Canvas API 基本操作。

type Ctx = CanvasRenderingContext2D;

/** 填充矩形 */
export function fillRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

/** 水平线性渐变矩形（左→右） */
export function fillGradientRect(
  ctx: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  colorLeft: string,
  colorRight: string,
): void {
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, colorLeft);
  grad.addColorStop(1, colorRight);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

/** 圆形 badge：填充圆 + 居中文字 */
export function drawBadge(
  ctx: Ctx,
  cx: number,
  cy: number,
  radius: number,
  text: string,
  bgColor: string,
  textColor: string,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = bgColor;
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, cx, cy);
}

/** 截断文本绘制：超出 maxWidth 末尾显示 "…" */
export function fillTruncatedText(
  ctx: Ctx,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  if (ctx.measureText(text).width <= maxWidth) {
    ctx.fillText(text, x, y, maxWidth);
    return;
  }

  // 二分查找最大可放字符数
  const ellipsis = '…';
  const ellipsisW = ctx.measureText(ellipsis).width;
  let lo = 0;
  let hi = text.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    if (ctx.measureText(text.slice(0, mid)).width + ellipsisW <= maxWidth) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }
  ctx.fillText(text.slice(0, lo) + ellipsis, x, y, maxWidth);
}

/** 水平分隔线 */
export function drawHorizontalRule(
  ctx: Ctx,
  x: number,
  y: number,
  width: number,
  color: string,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y + 0.5);
  ctx.lineTo(x + width, y + 0.5);
  ctx.stroke();
}
