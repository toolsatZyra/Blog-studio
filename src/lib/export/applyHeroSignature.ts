// Browser-only: composite the light signature onto a generated hero PNG.
//
// Thin by design. All the overlay content comes from heroSignatureSvg() (pure,
// unit-tested); this file is only the canvas plumbing that draws the PNG and
// then the overlay on top, and re-encodes to PNG. There is nothing here worth a
// unit test that a DOM could not already break.
//
// The PNG arrives as a same-origin base64 data URI (our own /api/image), so the
// canvas is never tainted and toDataURL succeeds.

import { heroSignatureSvg } from './heroSignature';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image to sign.'));
    img.src = src;
  });
}

/**
 * Return a new base64 PNG with the signature baked in.
 *
 * @param pngBase64 raw base64 (no data: prefix), as HeroImage.base64 carries it.
 * @returns raw base64 of the composited PNG, same shape in.
 */
export async function applyHeroSignature(pngBase64: string): Promise<string> {
  const photo = await loadImage(`data:image/png;base64,${pngBase64}`);
  const w = photo.naturalWidth;
  const h = photo.naturalHeight;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D is unavailable in this browser.');

  ctx.drawImage(photo, 0, 0, w, h);

  const overlay = await loadImage(
    `data:image/svg+xml;base64,${btoa(heroSignatureSvg(w, h))}`,
  );
  ctx.drawImage(overlay, 0, 0, w, h);

  // toDataURL returns "data:image/png;base64,XXXX" - strip the prefix to match
  // the raw-base64 contract of HeroImage.base64.
  return canvas.toDataURL('image/png').split(',')[1];
}
