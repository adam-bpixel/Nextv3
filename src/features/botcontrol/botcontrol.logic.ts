import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  ContainerBuilder,
  MessageFlags,
  LabelBuilder,
  ModalBuilder,
  SeparatorBuilder,
  StringSelectMenuBuilder,
  TextDisplayBuilder,
  type Client,
} from 'discord.js';
import config, { isOwner } from '../../core/config';
import { DEVICES, applyDeviceLive, getDeviceKey, resolveDevice } from '../../core/botDevice';
import type { CommandHandler } from '../../core/types';
import { successReply, usageReply } from '../../core/usage-replies';
import { STATUSES, isUsernameCheckerEnabled, resolveStatus, saveDevice, saveStatus, setUsernameCheckerEnabled } from './botcontrol.model';

const PANEL_TIMEOUT_MS = 5 * 60 * 1000;
const MODAL_TIMEOUT_MS = 2 * 60 * 1000;

type ControlKind = 'status' | 'device';

function panelPayload(client: Client, ownerId: string) {
  const status = resolveStatus(client.user?.presence.status === 'offline' ? 'invisible' : client.user?.presence.status);
  const device = resolveDevice(getDeviceKey());
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Bot Control'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `- __**Status**__ ﹕ \`${status?.label ?? 'Unknown'}\`\n- __**Device**__ ﹕ \`${device?.label ?? 'Unknown'}\``,
      ),
    )
    .addSeparatorComponents(new SeparatorBuilder())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(`bots:status:${ownerId}`).setLabel('Status').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`bots:device:${ownerId}`).setLabel('Device').setStyle(ButtonStyle.Secondary),
      ),
    );
  return { components: [container.toJSON()], flags: MessageFlags.IsComponentsV2, allowedMentions: { parse: [] as never[] } };
}

function buildModal(kind: ControlKind, ownerId: string): ModalBuilder {
  const isStatus = kind === 'status';
  const options = isStatus
    ? Object.entries(STATUSES).map(([key, info]) => ({ label: info.label, value: key }))
    : Object.entries(DEVICES).map(([key, info]) => ({ label: info.label, value: key }));
  const select = new StringSelectMenuBuilder()
    .setCustomId('value')
    .setPlaceholder(isStatus ? 'Choose a status' : 'Choose a device')
    .setMinValues(1)
    .setMaxValues(1)
    .addOptions(options);
  return new ModalBuilder()
    .setCustomId(`bots:${kind}:modal:${ownerId}`)
    .setTitle(isStatus ? 'Change Bot Status' : 'Change Bot Device')
    .addLabelComponents(new LabelBuilder().setLabel(isStatus ? 'Status' : 'Device').setStringSelectMenuComponent(select));
}

export const botControlLogic = {
  async ucheck(ctx) {
    const action = (ctx.args[0] ?? 'status').toLowerCase();
    if (action === 'on' || action === 'off') {
      await setUsernameCheckerEnabled(action === 'on');
      await ctx.send(successReply(ctx, `- The username checker is now \`${action === 'on' ? 'Enabled' : 'Disabled'}\`.`));
      return 'completed';
    }
    if (action === 'status') {
      await ctx.send(successReply(ctx, `- The username checker is \`${(await isUsernameCheckerEnabled()) ? 'Enabled' : 'Disabled'}\`.`));
      return 'completed';
    }
    await ctx.send(usageReply(ctx, `Say \`status\`, \`on\` or \`off\`.\nUse: \`${ctx.prefix}ucheck <status|on|off>\`.`));
    return 'skipped';
  },

  async bots(ctx) {
    const ownerId = ctx.user.id;
    const panel = await ctx.send(panelPayload(ctx.client, ownerId));

    const collector = panel.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: PANEL_TIMEOUT_MS,
      filter: (interaction) => interaction.customId.startsWith('bots:') && interaction.customId.endsWith(`:${ownerId}`),
    });

    collector.on('collect', (button) => {
      void (async () => {
        if (button.user.id !== ownerId || !isOwner(button.user.id)) {
          await button.reply({ content: 'Only the bot owner can use this panel.', flags: MessageFlags.Ephemeral }).catch(() => undefined);
          return;
        }

        const kind: ControlKind = button.customId.split(':')[1] === 'device' ? 'device' : 'status';
        await button.showModal(buildModal(kind, ownerId)).catch(() => undefined);
        const submitted = await button
          .awaitModalSubmit({
            time: MODAL_TIMEOUT_MS,
            filter: (modal) => modal.customId === `bots:${kind}:modal:${ownerId}` && modal.user.id === ownerId,
          })
          .catch(() => null);
        if (!submitted) return;

        const raw = submitted.fields.getStringSelectValues('value')[0] ?? '';
        try {
          let result: string;
          if (kind === 'status') {
            const target = resolveStatus(raw);
            if (!target) {
              await submitted.reply({ content: `Invalid status. Choose one of: ${Object.keys(STATUSES).join(', ')}.`, flags: MessageFlags.Ephemeral });
              return;
            }
            ctx.client.user?.setStatus(target.key);
            await saveStatus(target.key);
            result = `Status set to \`${target.label}\`.`;
          } else {
            const target = resolveDevice(raw);
            if (!target) {
              await submitted.reply({ content: `Invalid device. Choose one of: ${Object.keys(DEVICES).join(', ')}.`, flags: MessageFlags.Ephemeral });
              return;
            }
            await saveDevice(target.key);
            const live = await applyDeviceLive(ctx.client);
            result = `Device set to \`${target.label}\`.\n-#${live ? 'Applied live, it can take a few seconds to show up.' : 'Could not apply this live, it will take effect on the next restart.'}`;
          }
          await submitted.reply({ content: result, flags: MessageFlags.Ephemeral });
          await panel.edit({ components: panelPayload(ctx.client, ownerId).components }).catch(() => undefined);
        } catch (error) {
          console.error(`Updating the bot ${kind} failed:`, error instanceof Error ? error.message : String(error));
          await submitted.reply({ content: `Failed to update the bot's ${kind}. Please try again.`, flags: MessageFlags.Ephemeral }).catch(() => undefined);
        }
      })();
    });

    collector.on('end', () => {
      void panel.edit({ components: [] }).catch(() => undefined);
    });

    return 'completed';
  },
} satisfies Record<string, CommandHandler>;
