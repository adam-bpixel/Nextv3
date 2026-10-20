import { LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import type { ApplySettings, PanelText } from './setup.model';
import { SETUP_APPLY_CUSTOMIZE_MODAL, SETUP_APPLY_SEND_MODAL } from './setup.ui.apply.views';
import { LOG_CHANNEL_TYPES } from './setup.ui.shared';

export function buildApplyPanelTextModal(current?: PanelText): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_APPLY_CUSTOMIZE_MODAL)
    .setTitle('Customize Panel Text')
    .addLabelComponents(
      new LabelBuilder().setLabel('Title').setDescription('Leave empty for the default. Use {server} for the server name.').setTextInputComponent((input) => {
        input.setCustomId('title').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('{server} • Applications');
        return current?.title ? input.setValue(current.title) : input;
      }),
      new LabelBuilder().setLabel('Text').setDescription('Leave empty for the default. Use {server} for the server name.').setTextInputComponent((input) => {
        input
          .setCustomId('text')
          .setStyle(TextInputStyle.Paragraph)
          .setMaxLength(500)
          .setRequired(false)
          .setPlaceholder('We are looking for active and respectful members who want to help our community grow.');
        return current?.text ? input.setValue(current.text) : input;
      }),
    );
}

export function buildApplySendModal(settings?: ApplySettings): ModalBuilder {
  const isMenu = settings?.panelStyle === 'menu';
  return new ModalBuilder()
    .setCustomId(SETUP_APPLY_SEND_MODAL)
    .setTitle('Send Apply Panel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Panel Channel').setDescription('Where the apply panel will be posted').setChannelSelectMenuComponent((select) => {
        select.setCustomId('panel_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true);
        if (settings?.panelChannelId) select.setDefaultChannels(settings.panelChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Review Channel').setDescription('Where submitted applications are sent for review').setChannelSelectMenuComponent((select) => {
        select.setCustomId('review_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true);
        if (settings?.logChannelId) select.setDefaultChannels(settings.logChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Manager Roles').setDescription('Roles allowed to accept or reject applications').setRoleSelectMenuComponent((select) => {
        select.setCustomId('manager_roles').setMinValues(1).setMaxValues(5).setRequired(true);
        if (settings?.managerRoleIds.length) select.setDefaultRoles(...settings.managerRoleIds);
        return select;
      }),
      new LabelBuilder().setLabel('Panel Style').setDescription('Buttons or a dropdown menu').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('panel_style')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Buttons').setValue('button').setDescription('A row of buttons, one per category').setDefault(!isMenu),
            new StringSelectMenuOptionBuilder().setLabel('Select Menu').setValue('menu').setDescription('A single dropdown with every category').setDefault(isMenu),
          ),
      ),
      new LabelBuilder().setLabel('Panel Image').setDescription('Optional — upload a replacement; leave empty to keep the current image').setFileUploadComponent((upload) =>
        upload.setCustomId('panel_image').setMinValues(0).setMaxValues(1).setRequired(false),
      ),
    );
}
