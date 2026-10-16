import { MessageFlags, type ButtonInteraction } from 'discord.js';
import { defineRoute } from '../../core/types';
import { rolesPage } from './info.ui';

const CUSTOM_ID = /^info:roles:(\d{15,22}):(-?\d+)$/;

export const routes = [
  defineRoute<ButtonInteraction>({
    name: 'info:roles-nav',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && CUSTOM_ID.test(interaction.customId),
    async handle(interaction) {
      const parsed = CUSTOM_ID.exec(interaction.customId);
      if (!parsed) return;
      const [, invokerId, pageText] = parsed as unknown as [string, string, string];

      if (interaction.user.id !== invokerId) {
        await interaction.reply({ content: `Only <@${invokerId}> can use these buttons.`, flags: MessageFlags.Ephemeral, allowedMentions: { parse: [] } });
        return;
      }

      const guild = interaction.guild;
      if (!guild) return;
      await guild.members.fetch().catch(() => undefined);
      const roles = [...guild.roles.cache.values()].filter((role) => role.id !== guild.id).sort((a, b) => b.position - a.position);
      const lines = roles.map((role) => `<@&${role.id}> — \`${role.members.size}\` members`);
      await interaction.update(rolesPage(guild.name, lines, roles.length, Number(pageText), invokerId));
    },
  }),
];
