import { PermissionFlagsBits } from 'discord.js';

type SnakeCaseTail<S extends string> = S extends `${infer Head}${infer Rest}`
  ? `${Head extends Lowercase<Head> ? Head : `_${Lowercase<Head>}`}${SnakeCaseTail<Rest>}`
  : S;
type SnakeCase<S extends string> = S extends `${infer Head}${infer Rest}` ? `${Lowercase<Head>}${SnakeCaseTail<Rest>}` : S;

export type PermissionFlagName = keyof typeof PermissionFlagsBits;
export type PermissionName = SnakeCase<PermissionFlagName>;

export function toSnakeCase(flagName: string): string {
  return flagName.replace(/[A-Z]/g, (letter, offset: number) => (offset === 0 ? letter.toLowerCase() : `_${letter.toLowerCase()}`));
}

const BIT_BY_PERMISSION: ReadonlyMap<string, bigint> = new Map(
  Object.entries(PermissionFlagsBits).map(([flagName, bit]) => [toSnakeCase(flagName), bit]),
);

export function isPermissionName(value: string): value is PermissionName {
  return BIT_BY_PERMISSION.has(value);
}

export function permissionBit(permission: PermissionName): bigint {
  const bit = BIT_BY_PERMISSION.get(permission);
  if (bit === undefined) throw new Error(`Unknown permission "${permission}"`);
  return bit;
}

export function permissionLabel(permission: PermissionName): string {
  return permission.replace(/_/g, ' ');
}
