import db from '../../core/db';
import { isRecord } from '../../core/json';

const ALIASES_COLLECTION = 'commandAliases';
const DISABLED_COLLECTION = 'disabledCommands';
const COOLDOWN_OVERRIDES_COLLECTION = 'commandCooldownOverrides';

// --- Custom per-guild command aliases -------------------------------------
// Stored as { alias: realCommandName } so lookup at dispatch time is O(1).

export async function getAliasMap(guildId: string): Promise<Record<string, string>> {
  const value = await db.get(ALIASES_COLLECTION, guildId);
  if (!isRecord(value)) return {};
  const map: Record<string, string> = {};
  for (const [alias, target] of Object.entries(value)) if (typeof target === 'string') map[alias] = target;
  return map;
}

export async function resolveAlias(guildId: string, alias: string): Promise<string | null> {
  const map = await getAliasMap(guildId);
  return map[alias.toLowerCase()] ?? null;
}

export async function setAlias(guildId: string, alias: string, commandName: string): Promise<void> {
  const map = await getAliasMap(guildId);
  map[alias.toLowerCase()] = commandName.toLowerCase();
  await db.set(ALIASES_COLLECTION, guildId, map);
}

export async function removeAlias(guildId: string, alias: string): Promise<boolean> {
  const map = await getAliasMap(guildId);
  const key = alias.toLowerCase();
  if (!(key in map)) return false;
  delete map[key];
  await db.set(ALIASES_COLLECTION, guildId, map);
  return true;
}

// --- Per-guild disabled commands ------------------------------------------

export async function getDisabledCommands(guildId: string): Promise<string[]> {
  const value = await db.get(DISABLED_COLLECTION, guildId);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export async function isCommandDisabled(guildId: string, commandName: string): Promise<boolean> {
  return (await getDisabledCommands(guildId)).includes(commandName.toLowerCase());
}

export async function disableCommandFor(guildId: string, commandName: string): Promise<boolean> {
  const list = await getDisabledCommands(guildId);
  const name = commandName.toLowerCase();
  if (list.includes(name)) return false;
  await db.set(DISABLED_COLLECTION, guildId, [...list, name]);
  return true;
}

export async function enableCommandFor(guildId: string, commandName: string): Promise<boolean> {
  const list = await getDisabledCommands(guildId);
  const name = commandName.toLowerCase();
  if (!list.includes(name)) return false;
  await db.set(DISABLED_COLLECTION, guildId, list.filter((item) => item !== name));
  return true;
}

// --- Per-guild command cooldown overrides (seconds) -----------------------

export async function getCooldownOverrides(guildId: string): Promise<Record<string, number>> {
  const value = await db.get(COOLDOWN_OVERRIDES_COLLECTION, guildId);
  if (!isRecord(value)) return {};
  const map: Record<string, number> = {};
  for (const [name, seconds] of Object.entries(value)) if (typeof seconds === 'number' && seconds >= 0) map[name] = seconds;
  return map;
}

export async function getCooldownOverride(guildId: string, commandName: string): Promise<number | null> {
  const overrides = await getCooldownOverrides(guildId);
  return overrides[commandName.toLowerCase()] ?? null;
}

export async function setCooldownOverride(guildId: string, commandName: string, seconds: number): Promise<void> {
  const overrides = await getCooldownOverrides(guildId);
  overrides[commandName.toLowerCase()] = seconds;
  await db.set(COOLDOWN_OVERRIDES_COLLECTION, guildId, overrides);
}

export async function removeCooldownOverride(guildId: string, commandName: string): Promise<boolean> {
  const overrides = await getCooldownOverrides(guildId);
  const name = commandName.toLowerCase();
  if (!(name in overrides)) return false;
  delete overrides[name];
  await db.set(COOLDOWN_OVERRIDES_COLLECTION, guildId, overrides);
  return true;
}

export async function resetCooldownOverrides(guildId: string): Promise<number> {
  const overrides = await getCooldownOverrides(guildId);
  const count = Object.keys(overrides).length;
  await db.delete(COOLDOWN_OVERRIDES_COLLECTION, guildId);
  return count;
}
