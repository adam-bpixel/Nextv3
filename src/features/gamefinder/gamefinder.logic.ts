import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MessageFlags,
  SectionBuilder,
  SeparatorBuilder,
  TextDisplayBuilder,
  ThumbnailBuilder,
  type GuildMember,
  type MessageComponentInteraction,
} from 'discord.js';
import config from '../../core/config';
import { GAMEFINDER_JOIN_ICON, GAMEFINDER_PLAYER_ICON } from '../../core/emojis';
import { formatDuration } from '../../core/format';
import { themedReplyFor } from '../../core/usage-replies';
import { parsedEmoji } from '../setup/setup.ui.shared';
import { cachedColor } from '../theme/theme.model';
import { GAMEFINDER_MANAGER_COOLDOWN_FACTOR, cooldownRemainingMs, getGameFinderSettings, startCooldown, type GameFinderSettings } from './gamefinder.model';

const MAX_MEMBERS_SHOWN = 20;

const text = (content: string): TextDisplayBuilder => new TextDisplayBuilder().setContent(content);
const sep = (): SeparatorBuilder => new SeparatorBuilder();

function cooldownMsFor(member: GuildMember, settings: GameFinderSettings): number {
  if (settings.managerRoleId !== null && member.roles.cache.has(settings.managerRoleId)) {
    return Math.floor(settings.cooldownMs * GAMEFINDER_MANAGER_COOLDOWN_FACTOR);
  }
  return settings.cooldownMs;
}

function emojiImageURL(emoji: string | undefined): string | null {
  const parsed = parsedEmoji(emoji);
  if (!parsed?.id) return null;
  return `https://cdn.discordapp.com/emojis/${parsed.id}.${parsed.animated ? 'gif' : 'png'}`;
}

export async function handleGameTag(interaction: MessageComponentInteraction, gameId: string): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const settings = await getGameFinderSettings(guild.id);
  const game = settings.games.find((candidate) => candidate.id === gameId);
  if (!game) {
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'That game no longer exists.'));
    return;
  }

  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) return;

  const voiceChannel = member.voice.channel;
  if (!voiceChannel) {
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', 'Join a voice channel first, then tag the game.'));
    return;
  }

  const effectiveCooldownMs = cooldownMsFor(member, settings);
  if (effectiveCooldownMs > 0) {
    const remaining = await cooldownRemainingMs(guild.id, game.id, member.id);
    if (remaining > 0) {
      await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', `You can tag **${game.name}** again in \`${formatDuration(remaining)}\`.`));
      return;
    }
  }

  const members = [...voiceChannel.members.values()];
  const shown = members.slice(0, MAX_MEMBERS_SHOWN).map((voiceMember) => `- ${GAMEFINDER_PLAYER_ICON} <@${voiceMember.id}>`);
  const more = members.length - shown.length;
  const emojiPrefix = game.emoji ? `${game.emoji} ` : '';
  const imageURL = emojiImageURL(game.emoji);
  const accent = cachedColor(guild.id) ?? config.color;
  const headerText =
    `- __Tagged by:__ <@${member.id}>\n` +
    `- __Voice channel:__ ${voiceChannel.name}\n` +
    `- __Members in channel:__ \`${members.length}\``;

  const container = new ContainerBuilder()
    .setAccentColor(accent)
    .addTextDisplayComponents(text(`# ${emojiPrefix}${game.name}`))
    .addSeparatorComponents(sep());

  if (imageURL) {
    container.addSectionComponents(
      new SectionBuilder().addTextDisplayComponents(text(headerText)).setThumbnailAccessory(new ThumbnailBuilder().setURL(imageURL)),
    );
  } else {
    container.addTextDisplayComponents(text(headerText));
  }

  container
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('## Players in the channel'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`${shown.join('\n') || '- Nobody else yet'}${more > 0 ? `\n-# +${more} more` : ''}`))
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setLabel('Join Voice Channel')
          .setEmoji(GAMEFINDER_JOIN_ICON)
          .setStyle(ButtonStyle.Link)
          .setURL(`https://discord.com/channels/${guild.id}/${voiceChannel.id}`),
      ),
    );

  if (!voiceChannel.isSendable()) {
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', "I can't post in that voice channel - check my permissions there."));
    return;
  }

  try {
    await voiceChannel.send({ components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] } });
  } catch (error) {
    console.error('Sending game finder tag failed:', error);
    await interaction.editReply(themedReplyFor(interaction.guildId, true, 'error', "I couldn't post the tag in that voice channel - check my permissions there."));
    return;
  }

  if (effectiveCooldownMs > 0) await startCooldown(guild.id, game.id, member.id, effectiveCooldownMs);

  await interaction.editReply(themedReplyFor(interaction.guildId, true, 'success', `Tagged **${game.name}** in **${voiceChannel.name}**.`));
}
