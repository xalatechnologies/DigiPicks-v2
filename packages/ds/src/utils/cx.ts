/**
 * Tiny class-name joiner. Falsy values are filtered out.
 * Keeps the DS dependency-free.
 */
export type ClassValue = string | number | false | null | undefined;

export function cx(...args: ClassValue[]): string {
  return args.filter(Boolean).join(' ');
}
