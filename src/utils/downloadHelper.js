export function downloadCanvas(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const today = new Date();
      const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
      a.href = url;
      a.download = `인생네컷_${dateStr}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
      resolve();
    }, 'image/jpeg', 0.92);
  });
}
