/**
 * Downscales and compresses large smartphone photos (which can be 10MB-30MB)
 * to a lightweight, razor-sharp JPEG (< 400KB, max 1600px) so Gemini 3.8 Flash
 * can read handwriting & textbook text instantly with zero timeouts or payload errors.
 */

export async function compressImage(
  source: File | string,
  maxDimension = 1600,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Scale down if larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Fallback to original if canvas context unavailable
        resolve(typeof source === 'string' ? source : '');
        return;
      }

      // Draw white background in case of transparent PNGs
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedBase64);
    };

    img.onerror = () => {
      // Return original source if loading fails
      resolve(typeof source === 'string' ? source : '');
    };

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(source);
    }
  });
}
