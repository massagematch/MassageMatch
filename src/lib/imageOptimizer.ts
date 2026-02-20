// Image optimization utilities for WebP conversion and lazy loading

export function getOptimizedImageUrl(url: string | null, width?: number): string {
  if (!url) return '/placeholder-therapist.jpg'
  
  // If using Supabase Storage, add transform params
  if (url.includes('supabase.co/storage')) {
    const params = new URLSearchParams()
    if (width) params.set('width', width.toString())
    params.set('format', 'webp')
    params.set('quality', '80')
    return `${url}?${params.toString()}`
  }
  
  return url
}

export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}
