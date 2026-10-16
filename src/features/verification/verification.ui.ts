import type { APIEmbed, GuildMember } from 'discord.js';
import { discordTimestamp } from '../../core/format';
import type { TopVerifier, VerificationKind, VerificationLog } from './verification.model';

const LISTED_LOGS = 10;
const MALE_COLOR = 0x3b9dff;
const FEMALE_COLOR = 0xff6fcf;

const colorFor = (kind: VerificationKind): number => (kind === 'female' ? FEMALE_COLOR : MALE_COLOR);
const roleMention = (roleId: string): string => `<@&${roleId}>`;

export function verifiedDmEmbed(kind: VerificationKind, guildName: string, roleId: string): APIEmbed {
  return {
    color: colorFor(kind),
    title: kind === 'female' ? '♀️ Verified' : '♂️ Verified',
    description: `You have been verified as **${kind}** in **${guildName}**.\nRole: ${roleMention(roleId)}`,
  };
}

export function verifiedLogEmbed(kind: VerificationKind, target: GuildMember, verifierId: string, roleId: string): APIEmbed {
  return {
    color: colorFor(kind),
    title: 'Verification',
    description: [
      `Member: <@${target.id}> \`${target.user.username}\``,
      `Verified as: ${kind}`,
      `Role: ${roleMention(roleId)}`,
      `Verifier: <@${verifierId}>`,
      `Time: ${discordTimestamp(Date.now(), 'f')}`,
    ].join('\n'),
  };
}

export const verifiedChannelEmbed = (kind: VerificationKind, username: string, roleId: string): APIEmbed => ({
  title: 'Verification',
  description: `Verified **${username}** as **${kind}**.\nRole: ${roleMention(roleId)}`,
});

export function verificationLogsEmbed(username: string, logs: readonly VerificationLog[]): APIEmbed {
  const lines = logs
    .slice(-LISTED_LOGS)
    .reverse()
    .map((log) => `**${log.kind}** by <@${log.by}> ${discordTimestamp(log.at)}`);
  return { title: `Verification history of ${username} (${logs.length})`, description: lines.join('\n') || 'No verification logs.' };
}

export function topVerifiersEmbed(entries: readonly TopVerifier[]): APIEmbed {
  const lines = entries.map((entry, index) => `**${index + 1}.** <@${entry.verifierId}> — \`${entry.count}\` verified`);
  return { title: 'Top Verifiers', description: lines.join('\n') || 'No one has verified a member yet.' };
}
