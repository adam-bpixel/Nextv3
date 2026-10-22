import { MessageFlags, type ButtonInteraction, type Client, type ModalSubmitInteraction } from 'discord.js';
import { asBotClient } from '../../core/client';
import { defineRoute } from '../../core/types';
import { themedReplyFor } from '../../core/usage-replies';
import { MAX_DISABLED_COMMANDS, disableCommandFor, enableCommandFor, getDisabledCommands } from '../server/server.model';
import { NO_PERMISSION_TEXT, hasManageGuild, ownerFromSuffix, rejectOtherUser } from './setup.routes.helpers';
import {
  SETUP_COMMANDS_BUTTON,
  SETUP_COMMANDS_DISABLE_BUTTON,
  SETUP_COMMANDS_DISABLE_MODAL,
  SETUP_COMMANDS_ENABLE_BUTTON,
  SETUP_COMMANDS_ENABLE_MODAL,
  buildCommandsDisableModal,
  buildCommandsEnableModal,
  commandsView,
} from './setup.ui.commands';

const PROTECTED_COMMANDS = new Set(['disabledcmd', 'help', 'prefix']);

function parseNames(raw: string): string[] {
  return [...new Set(raw.toLowerCase().split(/[\s,]+/).filter(Boolean))];
}

function resolveCommandName(client: Client, input: string): string | null {
  const command = asBotClient(client).findPrefixCommand(input);
  if (command) return 'name' in command ? command.name : null;
  return asBotClient(client).slashCommands.has(input) ? input : null;
}

async function denyWithoutPermission(interaction: ButtonInteraction | ModalSubmitInteraction): Promise<boolean> {
  if (hasManageGuild(interaction)) return false;
  await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', NO_PERMISSION_TEXT));
  return true;
}

export const commandsRoutes = [
  defineRoute<ButtonInteraction>({
    name: 'setup:commands:view',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId.startsWith(SETUP_COMMANDS_BUTTON),
    async handle(interaction) {
      const ownerId = ownerFromSuffix(interaction.customId, SETUP_COMMANDS_BUTTON);
      if (!ownerId || (await rejectOtherUser(interaction, ownerId))) return;
      const guild = interaction.guild;
      if (!guild) return;
      if (await denyWithoutPermission(interaction)) return;
      await interaction.deferReply({ flags: MessageFlags.Ephemeral });
      await interaction.editReply(commandsView(await getDisabledCommands(guild.id)));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:commands:disable:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_COMMANDS_DISABLE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await denyWithoutPermission(interaction)) return;
      const remaining = MAX_DISABLED_COMMANDS - (await getDisabledCommands(guild.id)).length;
      if (remaining <= 0) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', `You can disable up to ${MAX_DISABLED_COMMANDS} commands.`));
        return;
      }
      await interaction.showModal(buildCommandsDisableModal(remaining));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:commands:disable:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_COMMANDS_DISABLE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await denyWithoutPermission(interaction)) return;
      await interaction.deferUpdate();
      const problems: string[] = [];
      for (const input of parseNames(interaction.fields.getTextInputValue('names'))) {
        const name = resolveCommandName(interaction.client, input);
        const command = name ? asBotClient(interaction.client).findPrefixCommand(name) : undefined;
        if (!name) {
          problems.push(`\`${input}\` is not a known command.`);
        } else if (PROTECTED_COMMANDS.has(name) || (command && 'ownerOnly' in command && command.ownerOnly)) {
          problems.push(`\`${name}\` can't be disabled.`);
        } else {
          try {
            await disableCommandFor(guild.id, name);
          } catch (error) {
            problems.push(error instanceof Error ? error.message : `Could not disable \`${name}\`.`);
            break;
          }
        }
      }
      await interaction.editReply(commandsView(await getDisabledCommands(guild.id)));
      if (problems.length) await interaction.followUp(themedReplyFor(interaction.guildId, true, 'error', problems.slice(0, 5).join('\n')));
    },
  }),

  defineRoute<ButtonInteraction>({
    name: 'setup:commands:enable:open',
    match: (interaction): interaction is ButtonInteraction => interaction.isButton() && interaction.customId === SETUP_COMMANDS_ENABLE_BUTTON,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await denyWithoutPermission(interaction)) return;
      const disabled = await getDisabledCommands(guild.id);
      if (!disabled.length) {
        await interaction.reply(themedReplyFor(interaction.guildId, true, 'error', 'There are no disabled commands to enable.'));
        return;
      }
      await interaction.showModal(buildCommandsEnableModal(disabled));
    },
  }),

  defineRoute<ModalSubmitInteraction>({
    name: 'setup:commands:enable:submit',
    match: (interaction): interaction is ModalSubmitInteraction => interaction.isModalSubmit() && interaction.customId === SETUP_COMMANDS_ENABLE_MODAL,
    async handle(interaction) {
      const guild = interaction.guild;
      if (!guild) return;
      if (await denyWithoutPermission(interaction)) return;
      await interaction.deferUpdate();
      for (const name of interaction.fields.getStringSelectValues('names')) {
        await enableCommandFor(guild.id, name);
      }
      await interaction.editReply(commandsView(await getDisabledCommands(guild.id)));
    },
  }),
];
