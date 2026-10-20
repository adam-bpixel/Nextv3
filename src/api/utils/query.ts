import { badRequest } from '../errors';

export function parseLimit(raw: unknown, fallback: number, max: number): number {
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  if (!Number.isFinite(value) || value <= 0) return fallback;
  return Math.min(Math.floor(value), max);
}

export function requireParam(raw: string | string[] | undefined, name: string): string {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) throw badRequest(`${name} is required.`);
  return value;
}
