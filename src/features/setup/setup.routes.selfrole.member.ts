import { MessageFlags, type ButtonInteraction, type StringSelectMenuInteraction } from 'discord.js';
import config from '../../core/config';
import { defineRoute } from '../../core/types';
import { cachedColor } from '../theme/theme.model';
import { themedReplyFor } from '../../core/usage-replies';
import { getGuildSetup } from './setup.model';
import { SELFROLE_SELECT_ID, SELFROLE_TOGGLE_PREFIX, selfRoleLogCard } from './setup.ui.selfrole';

async function toggleSelfRoles(
  interaction: ButtonInteraction | StringSelectMenuInteraction,
  selections: readonly { sectionId: string; roleId: string }[],
): Promise<void> {
  const guild = interaction.guild;
  if (!guild) return;
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const setup = await getGuildSetup(guild.id);
  const sections = setup.selfRoleSections ?? [];
  const member = await guild.members.fetch(interaction.user.id).catch(() => null);
  if (!member) return;

  const lines: string[] = [];
  let changed = false;

  for (const { sectionId, roleId } of selections) {
    const section = sections.find((candidate) => candidate.id === sectionId);
    const button = section?.buttons.find((candidate) => candidate.roleId === roleId);
    if (!section || !button) {
      lines.push(`<@&${roleId}> is no longer available.`);
      continue;
    }

    const role = guild.roles.cache.get(roleId);
    if (!role || !role.editable) {
      lines.push(`I can't manage <@&${roleId}> - check my permissions and role position.`);
      continue;
    }

    const sectionRoleIds = new Set(section.buttons.map((candidate) => candidate.roleId));
    const hadRole = member.roles.cache.has(roleId);
    try {
      if (hadRole) {
        await member.roles.remove(roleId);
        lines.push(`The <@&${roleId}> role was removed.`);
      } else {
        if (section.mode === 'single') {
          const currentSectionRoles = [...member.roles.cache.keys()].filter((id) => sectionRoleIds.has(id) && id !== roleId);
          if (currentSectionRoles.length) await member.roles.remove(currentSectionRoles);
        }
        await member.roles.add(roleId);
        lines.push(`You now have the <@&${roleId}> role.`);
      }
      changed = true;
    } catch (error) {
      console.error('Self role toggle failed:', error);
      lines.push(`I couldn't update <@&${roleId}> - check my permissions.`);
      continue;
    }

    if (setup.selfRole?.logChannelId) {
      const logChannel = await guild.channels.fetch(setup.selfRole.logChannelId).catch(() => null);
      if (logChannel?.isTextBased() && logChannel.isSendable()) {
        const card = selfRoleLogCard(cachedColor(guild.id) ?? config.color, { memberId: member.id, roleId, sectionName: section.name, added: !hadRole, at: Date.now() });
        await logChannel.send({ ...card, allowedMentions: { parse: [] } }).catch(() => null);
      }
    }
  }

  await interaction.editReply(themedReplyFor(interaction.guildId, true, changed ? 'success' : 'error', lines.join('\n')));
}

export const selfRoleMemberRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:selfrole:toggle',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SELFROLE_TOGGLE_PREFIX),
    async handle(interaction) {
      const rest = interaction.customId.slice(SELFROLE_TOGGLE_PREFIX.length);
      const [sectionId, roleId] = rest.split(':');
      if (!sectionId || !roleId) return;
      await toggleSelfRoles(interaction, [{ sectionId, roleId }]);
    },
  }),

  defineRoute<StringSelectMenuInteraction>({
    name: 'setup:selfrole:select',
    match: (interaction): interaction is StringSelectMenuInteraction => interaction.isStringSelectMenu() && interaction.customId === SELFROLE_SELECT_ID,
    async handle(interaction) {
      if (!interaction.values.length) {
        await interaction.deferUpdate();
        return;
      }
      const selections = interaction.values
        .map((value) => {
          const [sectionId, roleId] = value.split(':');
          return sectionId && roleId ? { sectionId, roleId } : null;
        })
        .filter((value): value is { sectionId: string; roleId: string } => value !== null);
      if (!selections.length) return;
      await toggleSelfRoles(interaction, selections);
    },
  }),
];
