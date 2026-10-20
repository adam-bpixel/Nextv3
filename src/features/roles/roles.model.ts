import db from '../../core/db';

const SETTINGS = 'roleSettings';

export interface RoleSettings {
  moveRoleId: string | null;
  roleLogsChannelId: string | null;
}

const emptySettings = (): RoleSettings => ({ moveRoleId: null, roleLogsChannelId: null });

export async function roleSettingsOf(guildId: string): Promise<RoleSettings> {
  const value = await db.get(SETTINGS, guildId);
  return value && typeof value === 'object' ? { ...emptySettings(), ...(value as Partial<RoleSettings>) } : emptySettings();
}

export async function saveRoleSettings(guildId: string, settings: RoleSettings): Promise<void> {
  await db.set(SETTINGS, guildId, settings);
}
