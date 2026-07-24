// Browser-only: rasterise an SVG string to a PNG, returned as raw base64.
//
// The hero pattern (heroPattern.ts) is deterministic SVG; the site commits and
// renders a PNG poster. This is the thin canvas bridge between them. All the
// design lives in the pure SVG - this file is only plumbing, so it carries no
// unit test a DOM could not already break.

/** Draw an SVG at the given pixel size and return the PNG as raw base64. */
export async function svgToPngBase64(svg: string, width: number, height: number): Promise<string> {
  const url = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('Could not rasterise the hero SVG.'));
    el.src = url;
  });

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');
  ctx.drawImage(img, 0, 0, width, height);

  return canvas.toDataURL('image/png').split(',')[1];
}
