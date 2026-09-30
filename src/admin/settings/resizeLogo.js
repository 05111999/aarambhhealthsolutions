const MAX_BYTES = 200 * 1024;

// Shrinks an uploaded logo in the browser so it can live inside the hospital's
// Firestore document (no file storage needed). PNG keeps transparency; if that's still
// too big (e.g. a photo), it falls back to JPEG on white.
export function resizeLogo(file, maxSize = 300) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file (PNG, JPG, SVG or WebP).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('That image is over 5MB — please choose a smaller one.'));
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * ratio));
      const h = Math.max(1, Math.round(img.height * ratio));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      let data = canvas.toDataURL('image/png');
      if (data.length > MAX_BYTES * 1.37) {
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
        data = canvas.toDataURL('image/jpeg', 0.85);
      }
      URL.revokeObjectURL(url);
      resolve(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image.'));
    };
    img.src = url;
  });
}
