import { LabelBuilder, ModalBuilder, StringSelectMenuOptionBuilder, TextInputStyle } from 'discord.js';
import type { SelfRoleSection, SelfRoleSettings } from './setup.model';
import {
  SETUP_SELFROLE_ADD_MODAL,
  SETUP_SELFROLE_BUTTON_ADD_MODAL_PREFIX,
  SETUP_SELFROLE_BUTTON_REMOVE_MODAL_PREFIX,
  SETUP_SELFROLE_EDIT_MODAL_PREFIX,
  SETUP_SELFROLE_REMOVE_MODAL,
  SETUP_SELFROLE_SEND_MODAL,
  selfRoleModeLabel,
} from './setup.ui.selfrole';
import { LOG_CHANNEL_TYPES, parsedEmoji } from './setup.ui.shared';

export function buildSelfRoleSectionAddModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_SELFROLE_ADD_MODAL)
    .setTitle('Add Self Role Section')
    .addLabelComponents(
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setPlaceholder('e.g. Pronoun Roles'),
      ),
      new LabelBuilder().setLabel('Mode').setDescription('Single: picking a role replaces the old one. Multiple: each role toggles on its own.').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('mode')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Single Role').setValue('single').setDescription('Only one role from this section at a time').setDefault(true),
            new StringSelectMenuOptionBuilder().setLabel('Multiple Roles').setValue('multiple').setDescription('Any number of roles from this section'),
          ),
      ),
      new LabelBuilder().setLabel('Description').setDescription('Optional — custom text shown above the roles in the panel').setTextInputComponent((input) =>
        input.setCustomId('description').setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false).setPlaceholder('e.g. Pick your pronoun roles below'),
      ),
      new LabelBuilder().setLabel('Embed Color').setDescription('Optional — hex color, e.g. #5865F2. Leave empty to use the default color').setTextInputComponent((input) =>
        input.setCustomId('color').setStyle(TextInputStyle.Short).setMaxLength(7).setRequired(false).setPlaceholder('#5865F2'),
      ),
      new LabelBuilder().setLabel('Image').setDescription('Optional — shown in the panel').setFileUploadComponent((upload) =>
        upload.setCustomId('image').setMinValues(0).setMaxValues(1).setRequired(false),
      ),
    );
}

export function buildSelfRoleSectionEditModal(section: SelfRoleSection): ModalBuilder {
  const isMultiple = section.mode === 'multiple';
  return new ModalBuilder()
    .setCustomId(`${SETUP_SELFROLE_EDIT_MODAL_PREFIX}${section.id}`)
    .setTitle('Edit Self Role Section')
    .addLabelComponents(
      new LabelBuilder().setLabel('Name').setTextInputComponent((input) =>
        input.setCustomId('name').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(true).setValue(section.name),
      ),
      new LabelBuilder().setLabel('Mode').setDescription('Single: picking a role replaces the old one. Multiple: each role toggles on its own.').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('mode')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Single Role').setValue('single').setDescription('Only one role from this section at a time').setDefault(!isMultiple),
            new StringSelectMenuOptionBuilder().setLabel('Multiple Roles').setValue('multiple').setDescription('Any number of roles from this section').setDefault(isMultiple),
          ),
      ),
      new LabelBuilder().setLabel('Description').setDescription('Optional — custom text shown above the roles in the panel').setTextInputComponent((input) => {
        input.setCustomId('description').setStyle(TextInputStyle.Paragraph).setMaxLength(500).setRequired(false).setPlaceholder('e.g. Pick your pronoun roles below');
        if (section.description) input.setValue(section.description);
        return input;
      }),
      new LabelBuilder().setLabel('Embed Color').setDescription('Optional — hex color, e.g. #5865F2. Leave empty to use the default color').setTextInputComponent((input) => {
        input.setCustomId('color').setStyle(TextInputStyle.Short).setMaxLength(7).setRequired(false).setPlaceholder('#5865F2');
        if (section.color) input.setValue(section.color);
        return input;
      }),
      new LabelBuilder().setLabel('Image').setDescription('Optional — upload a replacement; leave empty to keep the current image').setFileUploadComponent((upload) =>
        upload.setCustomId('image').setMinValues(0).setMaxValues(1).setRequired(false),
      ),
    );
}

export function buildSelfRoleSectionRemoveModal(sections: readonly SelfRoleSection[]): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_SELFROLE_REMOVE_MODAL)
    .setTitle('Remove Self Role Section')
    .addLabelComponents(
      new LabelBuilder().setLabel('Section').setStringSelectMenuComponent((select) => {
        select.setCustomId('section').setMinValues(1).setMaxValues(1);
        for (const section of sections) {
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(section.name.slice(0, 100))
              .setValue(section.id)
              .setDescription(`${selfRoleModeLabel(section.mode)} — ${section.buttons.length} role(s)`),
          );
        }
        return select;
      }),
    );
}

export function buildSelfRoleButtonAddModal(sectionId: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_SELFROLE_BUTTON_ADD_MODAL_PREFIX}${sectionId}`)
    .setTitle('Add Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Role').setDescription('The role this button gives').setRoleSelectMenuComponent((select) =>
        select.setCustomId('role').setMinValues(1).setMaxValues(1).setRequired(true),
      ),
      new LabelBuilder().setLabel('Button Label').setDescription('Optional — defaults to the role name').setTextInputComponent((input) =>
        input.setCustomId('label').setStyle(TextInputStyle.Short).setMaxLength(80).setRequired(false).setPlaceholder('e.g. She/Her'),
      ),
      new LabelBuilder().setLabel('Emoji').setDescription('Optional — a normal emoji or a custom one like <:name:id>').setTextInputComponent((input) =>
        input.setCustomId('emoji').setStyle(TextInputStyle.Short).setMaxLength(100).setRequired(false).setPlaceholder('Put your emoji'),
      ),
    );
}

export function buildSelfRoleButtonRemoveModal(section: SelfRoleSection): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${SETUP_SELFROLE_BUTTON_REMOVE_MODAL_PREFIX}${section.id}`)
    .setTitle('Remove Role')
    .addLabelComponents(
      new LabelBuilder().setLabel('Role').setStringSelectMenuComponent((select) => {
        select.setCustomId('role').setMinValues(1).setMaxValues(1);
        for (const button of section.buttons) {
          const option = new StringSelectMenuOptionBuilder().setLabel(button.label.slice(0, 100)).setValue(button.roleId);
          const emoji = parsedEmoji(button.emoji);
          if (emoji) option.setEmoji(emoji);
          select.addOptions(option);
        }
        return select;
      }),
    );
}

export function buildSelfRoleSendModal(sections: readonly SelfRoleSection[], settings?: SelfRoleSettings): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(SETUP_SELFROLE_SEND_MODAL)
    .setTitle('Send Self Role Panel')
    .addLabelComponents(
      new LabelBuilder().setLabel('Sections').setDescription('Which section(s) to post — pick several to combine them into one panel').setStringSelectMenuComponent((select) => {
        select.setCustomId('sections').setMinValues(1).setMaxValues(Math.min(sections.length, 25));
        for (const section of sections) {
          select.addOptions(
            new StringSelectMenuOptionBuilder()
              .setLabel(section.name.slice(0, 100))
              .setValue(section.id)
              .setDescription(`${selfRoleModeLabel(section.mode)} — ${section.buttons.length} role(s)`),
          );
        }
        return select;
      }),
      new LabelBuilder().setLabel('Interaction Type').setDescription('How members pick roles from the panel').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('interaction')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Buttons').setValue('buttons').setDescription('One button per role').setDefault(true),
            new StringSelectMenuOptionBuilder().setLabel('Select Menu').setValue('select_menu').setDescription('A single dropdown with every role'),
          ),
      ),
      new LabelBuilder().setLabel('Panel Channel').setDescription('Where this panel will be posted').setChannelSelectMenuComponent((select) =>
        select.setCustomId('panel_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(1).setMaxValues(1).setRequired(true),
      ),
      new LabelBuilder().setLabel('Log Channel').setDescription('Optional — where role grants/removals are logged').setChannelSelectMenuComponent((select) => {
        select.setCustomId('log_channel').setChannelTypes(...LOG_CHANNEL_TYPES).setMinValues(0).setMaxValues(1).setRequired(false);
        if (settings?.logChannelId) select.setDefaultChannels(settings.logChannelId);
        return select;
      }),
      new LabelBuilder().setLabel('Panel Style').setDescription('Classic embed or a modern component layout').setStringSelectMenuComponent((select) =>
        select
          .setCustomId('panel_style')
          .setMinValues(1)
          .setMaxValues(1)
          .addOptions(
            new StringSelectMenuOptionBuilder().setLabel('Embed').setValue('embed').setDescription('Classic embed display'),
            new StringSelectMenuOptionBuilder().setLabel('Components').setValue('components').setDescription('Modern container-based display').setDefault(true),
          ),
      ),
    );
}
