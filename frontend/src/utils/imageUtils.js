// src/utils/imageUtils.js
// Shared image compression & thumbnail utilities

/**
 * Compress an image file to WebP with optional resize.
 * Returns { file, originalSize, newSize, width, height }
 */
export async function compressImage(file, { maxWidth, maxHeight, quality = 0.82, mimeType = 'image/webp' } = {}) {
  if (!file?.type?.startsWith('image/')) throw new Error('File non immagine');

  const bitmap = await new Promise((resolve, reject) => {
    if ('createImageBitmap' in window) {
      createImageBitmap(file).then(resolve).catch(() => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    } else {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    }
  });

  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;
  const ratioW = maxWidth ? maxWidth / originalWidth : 1;
  const ratioH = maxHeight ? maxHeight / originalHeight : 1;
  const ratio = Math.min(ratioW, ratioH, 1);
  const targetWidth = Math.round(originalWidth * ratio);
  const targetHeight = Math.round(originalHeight * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d', { alpha: true });
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

  const blob = await new Promise((resolve) => canvas.toBlob((b) => resolve(b), mimeType, quality));
  if (!blob) throw new Error('Compressione fallita');

  const ext = mimeType === 'image/webp' ? 'webp' : mimeType === 'image/jpeg' ? 'jpg' : 'png';
  const safeName = (file.name || 'image').replace(/\.[^/.]+$/, '');
  const compressedFile = new File([blob], `${safeName}.${ext}`, { type: blob.type });

  return { file: compressedFile, originalSize: file.size, newSize: compressedFile.size, width: targetWidth, height: targetHeight };
}

/**
 * Derive thumbnail URL from a full-size Supabase Storage URL.
 * Convention: /cover-1234567890.webp  →  /cover-1234567890-thumb.webp
 * Falls back to original URL if no match.
 */
export function toThumbUrl(url) {
  if (!url) return url;
  return url.replace(/(-\d+)(\.webp)$/, '$1-thumb$2');
}
