import type { APIEmbed } from 'discord.js';
import { discordTimestamp, formatDuration } from '../../core/format';
import type { Warning } from './warnings.model';

const LISTED_WARNINGS = 10;

export const bannedEmbed = (username: string, reason: string): APIEmbed => ({ title: '🔨 Banned', description: `**${username}** was banned.\nReason: ${reason}` });

export const unbannedEmbed = (userId: string): APIEmbed => ({ title: '✅ Unbanned', description: `<@${userId}> can join again.` });

export const kickedEmbed = (username: string, reason: string): APIEmbed => ({ title: '👢 Kicked', description: `**${username}** was kicked.\nReason: ${reason}` });

export const timedOutEmbed = (username: string, until: number, reason: string): APIEmbed => ({
  title: '🔇 Timed out',
  description: `**${username}** until ${discordTimestamp(until, 'f')}.\nReason: ${reason}`,
});

export const timeoutRemovedEmbed = (username: string): APIEmbed => ({ title: '🔊 Timeout removed', description: `**${username}** can talk again.` });

export const purgedEmbed = (deleted: number): APIEmbed => ({ description: `🧹 Deleted **${deleted}** messages.` });

export const slowmodeEmbed = (seconds: number): APIEmbed => ({
  description: seconds ? `🐢 Slowmode set to **${formatDuration(seconds * 1000)}**.` : '🐇 Slowmode is off.',
});

export const lockedEmbed = (locked: boolean): APIEmbed => ({ description: locked ? '🔒 This channel is locked.' : '🔓 This channel is unlocked.' });

export const warnedEmbed = (username: string, total: number, reason: string): APIEmbed => ({
  title: '⚠️ Warned',
  description: `**${username}** now has **${total}** warning(s).\nReason: ${reason}`,
});

export function warningsEmbed(username: string, warnings: readonly Warning[]): APIEmbed {
  const lines = warnings.slice(-LISTED_WARNINGS).map((warning, index) => `**${index + 1}.** ${warning.reason} — <@${warning.by}> ${discordTimestamp(warning.at)}`);
  return { title: `Warnings of ${username} (${warnings.length})`, description: lines.join('\n') || 'No warnings.' };
}
