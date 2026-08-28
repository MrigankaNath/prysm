import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** shadcn's class helper: conditional classes, with later Tailwind utilities
 *  beating earlier ones instead of both landing and the cascade deciding. */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
