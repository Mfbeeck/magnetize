import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateShareUrl(baseUrl: string, contentType: 'idea' | 'result'): string {
  const url = new URL(baseUrl, window.location.origin);
  
  // Add UTM parameters
  url.searchParams.set('utm_source', 'magnetize');
  url.searchParams.set('utm_medium', 'organic_share');
  url.searchParams.set('utm_content', contentType);
  
  return url.toString();
}

export function isFromShareLink(): boolean {
  if (typeof window === 'undefined') return false;
  
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('utm_source') === 'magnetize' && 
         urlParams.get('utm_medium') === 'organic_share';
}
