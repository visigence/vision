/**
 * Image optimization utilities for better performance and user experience
 */

/**
 * Generate responsive image sources for different screen sizes
 * @param baseUrl - The base image URL
 * @param options - Configuration options for image optimization
 * @returns Object with different image sizes
 */
export interface ImageSources {
  small: string;
  medium: string;
  large: string;
  original: string;
}

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  fit?: 'crop' | 'contain' | 'cover' | 'fill' | 'scale';
  background?: string;
}

export function generateResponsiveImages(
  baseUrl: string, 
  options: ImageOptimizationOptions = {}
): ImageSources {
  const {
    quality = 80,
    format = 'auto',
    fit = 'crop',
    background = 'transparent'
  } = options;

  // Check if the URL is from a service that supports query parameters
  const supportsOptimization = baseUrl.includes('imgur.com') || 
                               baseUrl.includes('cloudinary.com') ||
                               baseUrl.includes('imagekit.io');

  if (!supportsOptimization) {
    // Return the same URL for all sizes if optimization is not supported
    return {
      small: baseUrl,
      medium: baseUrl,
      large: baseUrl,
      original: baseUrl
    };
  }

  // For Imgur URLs, use their built-in resizing
  if (baseUrl.includes('imgur.com')) {
    const baseWithoutExtension = baseUrl.replace(/\.[^/.]+$/, '');
    return {
      small: `${baseWithoutExtension}s.jpg`, // Small square (90x90)
      medium: `${baseWithoutExtension}m.jpg`, // Medium thumbnail (320x320)
      large: `${baseWithoutExtension}l.jpg`, // Large thumbnail (640x640)
      original: baseUrl
    };
  }

  // For other services, construct query parameters
  const params = new URLSearchParams({
    q: quality.toString(),
    f: format,
    fit,
    bg: background
  });

  return {
    small: `${baseUrl}?w=400&h=300&${params.toString()}`,
    medium: `${baseUrl}?w=800&h=600&${params.toString()}`,
    large: `${baseUrl}?w=1200&h=900&${params.toString()}`,
    original: baseUrl
  };
}

/**
 * Generate srcSet string for responsive images
 * @param sources - Image sources object
 * @returns srcSet string for use in img elements
 */
export function generateSrcSet(sources: ImageSources): string {
  return [
    `${sources.small} 400w`,
    `${sources.medium} 800w`,
    `${sources.large} 1200w`
  ].join(', ');
}

/**
 * Generate sizes attribute for responsive images
 * @param breakpoints - Custom breakpoints (optional)
 * @returns sizes string for use in img elements
 */
export function generateSizes(breakpoints?: {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}): string {
  const {
    mobile = 400,
    tablet = 800,
    desktop = 1200
  } = breakpoints || {};

  return [
    `(max-width: 768px) ${mobile}px`,
    `(max-width: 1200px) ${tablet}px`,
    `${desktop}px`
  ].join(', ');
}

/**
 * Preload critical images for better performance
 * @param imageUrls - Array of image URLs to preload
 * @param priority - Whether to use high priority loading
 */
export function preloadImages(imageUrls: string[], priority = false): void {
  imageUrls.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    
    if (priority) {
      link.setAttribute('fetchpriority', 'high');
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Lazy load images with Intersection Observer
 * @param imageElement - The image element to lazy load
 * @param options - Intersection Observer options
 */
export function lazyLoadImage(
  imageElement: HTMLImageElement,
  options: IntersectionObserverInit = {}
): void {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        const srcset = img.dataset.srcset;
        
        if (src) {
          img.src = src;
        }
        
        if (srcset) {
          img.srcset = srcset;
        }
        
        img.classList.remove('lazy');
        observer.unobserve(img);
      }
    });
  }, defaultOptions);

  observer.observe(imageElement);
}

/**
 * Optimize image loading with progressive enhancement
 * @param imageElement - The image element to optimize
 * @param sources - Responsive image sources
 * @param options - Additional options
 */
export function optimizeImageLoading(
  imageElement: HTMLImageElement,
  sources: ImageSources,
  options: {
    lazy?: boolean;
    priority?: boolean;
    placeholder?: string;
  } = {}
): void {
  const { lazy = true, priority = false, placeholder } = options;

  // Set up responsive images
  imageElement.srcset = generateSrcSet(sources);
  imageElement.sizes = generateSizes();

  // Add loading attribute
  if (lazy && !priority) {
    imageElement.loading = 'lazy';
  } else {
    imageElement.loading = 'eager';
  }

  // Add decoding hint
  imageElement.decoding = 'async';

  // Set placeholder if provided
  if (placeholder) {
    imageElement.style.backgroundImage = `url(${placeholder})`;
    imageElement.style.backgroundSize = 'cover';
    imageElement.style.backgroundPosition = 'center';
  }

  // Add error handling
  imageElement.addEventListener('error', () => {
    // Fallback to original image if optimized version fails
    imageElement.src = sources.original;
  });

  // Add load event for cleanup
  imageElement.addEventListener('load', () => {
    if (placeholder) {
      imageElement.style.backgroundImage = '';
    }
  });
}

/**
 * Create a blur placeholder for images
 * @param width - Placeholder width
 * @param height - Placeholder height
 * @param color - Base color for the placeholder
 * @returns Data URL for the blur placeholder
 */
export function createBlurPlaceholder(
  width = 40,
  height = 30,
  color = '#e5e7eb'
): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  canvas.width = width;
  canvas.height = height;
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, '#f3f4f6');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
}

/**
 * Check if WebP format is supported
 * @returns Promise that resolves to boolean indicating WebP support
 */
export function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
}

/**
 * Get optimal image format based on browser support
 * @returns Promise that resolves to the optimal format
 */
export async function getOptimalImageFormat(): Promise<'webp' | 'jpg'> {
  const supportsWebP = await checkWebPSupport();
  return supportsWebP ? 'webp' : 'jpg';
}