import type { APIEmbed } from 'discord.js';
import { discordTimestamp } from '../../core/format';
import type { JailedMember, JailLog } from './jail.model';

const LISTED_LOGS = 10;

export function jailInfoEmbed(username: string, jailed: JailedMember | null): APIEmbed {
  if (!jailed) return { title: `Jail Info — ${username}`, description: 'This user is not currently jailed.' };
  return {
    title: `Jail Info — ${username}`,
    description: `Jailed ${discordTimestamp(jailed.at)} by <@${jailed.by}>\nReason: ${jailed.reason}`,
  };
}

export function jailLogsEmbed(username: string, logs: readonly JailLog[]): APIEmbed {
  const lines = logs
    .slice(-LISTED_LOGS)
    .reverse()
    .map((log) => `**${log.action === 'jail' ? 'Jailed' : 'Unjailed'}** by <@${log.by}> ${discordTimestamp(log.at)}\n> ${log.reason}`);
  return { title: `Jail History of ${username} (${logs.length})`, description: lines.join('\n') || 'No jail history.' };
}
