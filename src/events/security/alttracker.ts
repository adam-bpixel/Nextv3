import { EmbedBuilder, Events, type Guild, type GuildTextBasedChannel } from 'discord.js';
import config from '../../core/config';
import { discordTimestamp, formatDuration } from '../../core/format';
import { defineEvent } from '../../core/types';
import { getGuildSecurity, type AltTrackerSettings } from '../../features/security/security.model';
import { cachedColor } from '../../features/theme/theme.model';

interface Resolved {
  channel: GuildTextBasedChannel;
  settings: AltTrackerSettings;
}

async function resolveAltTracker(guild: Guild): Promise<Resolved | null> {
  const security = await getGuildSecurity(guild.id);
  if (!security.alttracker.enabled || !security.alttracker.channelId) return null;
  const channel = await guild.channels.fetch(security.alttracker.channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return null;
  return { channel, settings: security.alttracker };
}

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;
    const resolved = await resolveAltTracker(member.guild);
    if (!resolved) return;
    const { channel, settings } = resolved;

    const accountAgeMs = Date.now() - member.user.createdTimestamp;
    if (accountAgeMs >= settings.minAccountAgeMs) return;

    const embed = new EmbedBuilder()
      .setColor(cachedColor(member.guild.id) ?? config.color)
      .setAuthor({ name: member.user.tag, iconURL: member.displayAvatarURL({ size: 128 }) })
      .setTitle('⚠️ Possible Alt Account')
      .setDescription(`<@${member.id}> just joined with a newly created account.`)
      .addFields(
        { name: 'Account Created', value: discordTimestamp(member.user.createdTimestamp), inline: true },
        { name: 'Account Age', value: formatDuration(accountAgeMs), inline: true },
        { name: 'Member Count', value: `${member.guild.memberCount}`, inline: true },
      )
      .setFooter({ text: `ID: ${member.id}` })
      .setTimestamp();

    await channel.send({ embeds: [embed] }).catch((error: unknown) => console.error('Alt tracker log failed:', error));
  },
});
