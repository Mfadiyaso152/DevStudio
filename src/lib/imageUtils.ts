/**
 * Compresses an image file in the browser using HTML5 Canvas
 * Reduces large 5MB-20MB camera uploads to ~50KB-150KB lightweight DataURLs
 */
export async function compressImageFile(file: File, maxWidth = 1200, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to decode image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Export as compressed JPEG / WebP
        try {
          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(compressedDataUrl);
        } catch {
          resolve(reader.result as string);
        }
      };

      if (typeof reader.result === 'string') {
        img.src = reader.result;
      } else {
        resolve('');
      }
    };

    reader.readAsDataURL(file);
  });
}
