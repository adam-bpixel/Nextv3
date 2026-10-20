import { ChannelType, type ButtonInteraction, type ModalSubmitInteraction } from 'discord.js';
import { permissionBit } from '../../core/permissions';
import { themedReplyFor } from '../../core/usage-replies';

export const PANEL_CHANNEL_TYPES = [ChannelType.GuildText, ChannelType.GuildAnnouncement] as const;
export const NO_PERMISSION_TEXT = 'You need the Manage Server permission to configure this.';

export function ownerFromSuffix(customId: string, prefix: string): string | null {
  const ownerId = customId.slice(prefix.length);
  return /^\d{15,22}$/.test(ownerId) ? ownerId : null;
}

export async function rejectOtherUser(interaction: ButtonInteraction | ModalSubmitInteraction, ownerId: string): Promise<boolean> {
  if (interaction.user.id === ownerId) return false;
  await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `Only <@${ownerId}> can use this setup panel.`));
  return true;
}

export function hasManageGuild(interaction: ButtonInteraction | ModalSubmitInteraction): boolean {
  return interaction.memberPermissions?.has(permissionBit('manage_guild')) ?? false;
}
