import type { Client, TextBasedChannel } from 'discord.js';
import { setChannelLocked } from '../moderation/moderation.service';
import { clearUnlock, deleteReminder, dueReminders, dueUnlocks } from './serverTools.model';

const CHECK_INTERVAL_MS = 30_000;

async function flushReminders(client: Client): Promise<void> {
  for (const reminder of await dueReminders(Date.now())) {
    try {
      const user = await client.users.fetch(reminder.userId).catch(() => null);
      if (user) await user.send(`⏰ Reminder: ${reminder.text}`).catch(() => undefined);
    } finally {
      await deleteReminder(reminder.id);
    }
  }
}

async function flushUnlocks(client: Client): Promise<void> {
  for (const lock of await dueUnlocks(Date.now())) {
    try {
      const guild = await client.guilds.fetch(lock.guildId).catch(() => null);
      const channel = guild ? await guild.channels.fetch(lock.channelId).catch(() => null) : null;
      if (guild && channel) await setChannelLocked(channel as unknown as TextBasedChannel, guild, false);
    } finally {
      await clearUnlock(lock.id);
    }
  }
}

export function startServerToolsScheduler(client: Client): void {
  setInterval(() => {
    flushReminders(client).catch((error: unknown) => console.error('Flushing reminders failed:', error));
    flushUnlocks(client).catch((error: unknown) => console.error('Flushing timelocks failed:', error));
  }, CHECK_INTERVAL_MS);
}
