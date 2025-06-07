/**
 * Performance optimization utilities
 */

/**
 * Debounce function to limit the rate of function execution
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @param immediate - Whether to execute immediately on first call
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func(...args);
  };
}

/**
 * Throttle function to limit function execution to once per specified time
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Memoization function to cache function results
 * @param func - Function to memoize
 * @param getKey - Function to generate cache key
 * @returns Memoized function
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
  getKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();
  
  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = getKey ? getKey(...args) : JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    
    const result = func(...args);
    cache.set(key, result);
    
    return result;
  }) as T;
}

/**
 * Request animation frame with fallback
 * @param callback - Function to execute
 * @returns Request ID for cancellation
 */
export function requestAnimationFramePolyfill(callback: FrameRequestCallback): number {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  
  return setTimeout(() => callback(Date.now()), 16);
}

/**
 * Cancel animation frame with fallback
 * @param id - Request ID to cancel
 */
export function cancelAnimationFramePolyfill(id: number): void {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Intersection Observer with fallback for older browsers
 * @param callback - Intersection callback
 * @param options - Observer options
 * @returns Observer instance or null
 */
export function createIntersectionObserver(
  callback: IntersectionObserverCallback,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !window.IntersectionObserver) {
    return null;
  }
  
  return new IntersectionObserver(callback, {
    root: null,
    rootMargin: '0px',
    threshold: 0.1,
    ...options
  });
}

/**
 * Measure performance of a function
 * @param name - Performance mark name
 * @param func - Function to measure
 * @returns Function result and performance data
 */
export async function measurePerformance<T>(
  name: string,
  func: () => T | Promise<T>
): Promise<{ result: T; duration: number }> {
  const startTime = performance.now();
  
  if (performance.mark) {
    performance.mark(`${name}-start`);
  }
  
  try {
    const result = await func();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    if (performance.mark && performance.measure) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
    }
    
    console.log(`Performance: ${name} took ${duration.toFixed(2)}ms`);
    
    return { result, duration };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.error(`Performance: ${name} failed after ${duration.toFixed(2)}ms`, error);
    throw error;
  }
}

/**
 * Batch DOM updates to improve performance
 * @param updates - Array of DOM update functions
 */
export function batchDOMUpdates(updates: (() => void)[]): void {
  requestAnimationFramePolyfill(() => {
    updates.forEach(update => update());
  });
}

/**
 * Preload resources for better performance
 * @param resources - Array of resource URLs
 * @param type - Resource type (script, style, image, etc.)
 */
export function preloadResources(
  resources: string[],
  type: 'script' | 'style' | 'image' | 'font' = 'image'
): void {
  resources.forEach(url => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'image':
        link.as = 'image';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Check if the user prefers reduced motion
 * @returns Boolean indicating reduced motion preference
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get device performance tier based on hardware capabilities
 * @returns Performance tier (low, medium, high)
 */
export function getDevicePerformanceTier(): 'low' | 'medium' | 'high' {
  if (typeof navigator === 'undefined') return 'medium';
  
  // Check for hardware concurrency (CPU cores)
  const cores = navigator.hardwareConcurrency || 4;
  
  // Check for device memory (if available)
  const memory = (navigator as any).deviceMemory || 4;
  
  // Check for connection type
  const connection = (navigator as any).connection;
  const effectiveType = connection?.effectiveType || '4g';
  
  // Determine performance tier
  if (cores >= 8 && memory >= 8 && effectiveType === '4g') {
    return 'high';
  } else if (cores >= 4 && memory >= 4) {
    return 'medium';
  } else {
    return 'low';
  }
}

/**
 * Optimize animations based on device performance
 * @param tier - Performance tier
 * @returns Animation configuration
 */
export function getOptimizedAnimationConfig(tier?: 'low' | 'medium' | 'high') {
  const performanceTier = tier || getDevicePerformanceTier();
  const reducedMotion = prefersReducedMotion();
  
  if (reducedMotion) {
    return {
      duration: 0,
      ease: 'linear',
      stagger: 0,
      particles: 0
    };
  }
  
  switch (performanceTier) {
    case 'low':
      return {
        duration: 0.3,
        ease: 'easeOut',
        stagger: 0.05,
        particles: 1000
      };
    case 'medium':
      return {
        duration: 0.5,
        ease: 'easeInOut',
        stagger: 0.1,
        particles: 3000
      };
    case 'high':
      return {
        duration: 0.8,
        ease: 'easeInOut',
        stagger: 0.15,
        particles: 5000
      };
    default:
      return {
        duration: 0.5,
        ease: 'easeInOut',
        stagger: 0.1,
        particles: 3000
      };
  }
}

/**
 * Monitor and log performance metrics
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();
  
  /**
   * Start measuring a metric
   * @param name - Metric name
   */
  start(name: string): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    performance.mark(`${name}-start`);
  }
  
  /**
   * End measuring a metric
   * @param name - Metric name
   */
  end(name: string): number {
    performance.mark(`${name}-end`);
    performance.measure(name, `${name}-start`, `${name}-end`);
    
    const entries = performance.getEntriesByName(name, 'measure');
    const duration = entries[entries.length - 1]?.duration || 0;
    
    const metrics = this.metrics.get(name) || [];
    metrics.push(duration);
    this.metrics.set(name, metrics);
    
    return duration;
  }
  
  /**
   * Get average duration for a metric
   * @param name - Metric name
   */
  getAverage(name: string): number {
    const metrics = this.metrics.get(name) || [];
    if (metrics.length === 0) return 0;
    
    return metrics.reduce((sum, value) => sum + value, 0) / metrics.length;
  }
  
  /**
   * Get all metrics
   */
  getAllMetrics(): Record<string, { average: number; count: number; latest: number }> {
    const result: Record<string, { average: number; count: number; latest: number }> = {};
    
    this.metrics.forEach((values, name) => {
      result[name] = {
        average: this.getAverage(name),
        count: values.length,
        latest: values[values.length - 1] || 0
      };
    });
    
    return result;
  }
  
  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();