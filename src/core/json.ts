export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonValue[] | JsonObject;
export interface JsonObject {
  [key: string]: JsonValue;
}

export class InvalidDataError extends Error {
  constructor(where: string, expected: string) {
    super(`${where}: expected ${expected}`);
    this.name = 'InvalidDataError';
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function toJsonValue(value: unknown, where: string): JsonValue {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) throw new InvalidDataError(where, 'a finite number');
    return value;
  }
  if (Array.isArray(value)) return value.map((item: unknown, index) => toJsonValue(item, `${where}[${index}]`));
  if (isRecord(value)) return toJsonObject(value, where);
  throw new InvalidDataError(where, 'JSON data');
}

export function toJsonObject(value: unknown, where: string): JsonObject {
  if (!isRecord(value)) throw new InvalidDataError(where, 'an object');
  const result: JsonObject = {};
  for (const [key, item] of Object.entries(value)) result[key] = toJsonValue(item, `${where}.${key}`);
  return result;
}

export function parseJsonText(text: string, where: string): JsonValue {
  const parsed: unknown = JSON.parse(text);
  return toJsonValue(parsed, where);
}

export function readString(source: JsonObject, key: string, where: string): string {
  const value = source[key];
  if (typeof value !== 'string') throw new InvalidDataError(`${where}.${key}`, 'a string');
  return value;
}

export function readNumber(source: JsonObject, key: string, where: string): number {
  const value = source[key];
  if (typeof value !== 'number') throw new InvalidDataError(`${where}.${key}`, 'a number');
  return value;
}

export function readOptionalString(source: JsonObject, key: string, where: string): string | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new InvalidDataError(`${where}.${key}`, 'a string');
  return value;
}

export function readOptionalNumber(source: JsonObject, key: string, where: string): number | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'number') throw new InvalidDataError(`${where}.${key}`, 'a number');
  return value;
}

export function readOptionalBoolean(source: JsonObject, key: string, where: string): boolean | undefined {
  const value = source[key];
  if (value === undefined) return undefined;
  if (typeof value !== 'boolean') throw new InvalidDataError(`${where}.${key}`, 'a boolean');
  return value;
}

export function readArray(source: JsonObject, key: string, where: string): JsonValue[] {
  const value = source[key];
  if (!Array.isArray(value)) throw new InvalidDataError(`${where}.${key}`, 'an array');
  return value;
}

export function readOptionalArray(source: JsonObject, key: string, where: string): JsonValue[] {
  const value = source[key];
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new InvalidDataError(`${where}.${key}`, 'an array');
  return value;
}

export function readObject(source: JsonObject, key: string, where: string): JsonObject {
  const value = source[key];
  if (!isRecord(value)) throw new InvalidDataError(`${where}.${key}`, 'an object');
  return value;
}

export function assertOnlyKeys(source: JsonObject, allowed: readonly string[], where: string): void {
  const unknownKey = Object.keys(source).find((key) => !allowed.includes(key));
  if (unknownKey !== undefined) throw new InvalidDataError(`${where}.${unknownKey}`, `one of ${allowed.join(', ')}`);
}
