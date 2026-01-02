import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatQuoteText(text: string): { __html: string } {
  if (!text) return { __html: '' };
  // Convert newlines to <br /> tags for HTML display
  const formattedText = text.replace(/\n/g, '<br />');
  // Optional: handle multiple spaces or other basic markdown if desired later
  return { __html: formattedText };
}

