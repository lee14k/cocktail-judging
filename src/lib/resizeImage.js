// Shrinks a photo in the browser before upload so a 12 MP phone picture
// becomes a ~200 KB JPEG. Returns a data URL the server can store directly.
export async function resizeImage(file, { maxEdge = 1600, quality = 0.84 } = {}) {
  const bitmap = await loadBitmap(file)
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, width, height)
  if (bitmap.close) bitmap.close()
  return canvas.toDataURL('image/jpeg', quality)
}

async function loadBitmap(file) {
  if ('createImageBitmap' in window) {
    try { return await createImageBitmap(file, { imageOrientation: 'from-image' }) } catch {}
  }
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => { URL.revokeObjectURL(url); resolve(img) }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't read that image.")) }
    img.src = url
  })
}
