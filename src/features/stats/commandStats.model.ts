import db from '../../core/db';

const COMMAND_STATS_COLLECTION = 'commandStats';

export async function recordCommandUse(userId: string): Promise<void> {
  const stored = await db.get(COMMAND_STATS_COLLECTION, userId);
  const count = typeof stored === 'number' ? stored : 0;
  await db.set(COMMAND_STATS_COLLECTION, userId, count + 1);
}

export async function commandsUsedBy(userId: string): Promise<number> {
  const stored = await db.get(COMMAND_STATS_COLLECTION, userId);
  return typeof stored === 'number' ? stored : 0;
}
