import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import {
  MAX_SELFROLE_BUTTONS,
  MAX_SELFROLE_SECTIONS,
  type SelfRoleButton,
  type SelfRoleMode,
  type SelfRolePanelInteraction,
  type SelfRolePanelStyle,
  type SelfRoleSection,
} from './setup.model';
import { chunk, panelIntroSection, parsedEmoji, sep, text, toPayload } from './setup.ui.shared';

export const SETUP_SELFROLE_BUTTON = 'setup:selfrole:view:';
export const SETUP_SELFROLE_ADD_BUTTON = 'setup:selfrole:add';
export const SETUP_SELFROLE_REMOVE_BUTTON = 'setup:selfrole:remove';
export const SETUP_SELFROLE_EDIT_BUTTON = 'setup:selfrole:edit';
export const SETUP_SELFROLE_EDIT_BACK_BUTTON = 'setup:selfrole:edit:back';
export const SETUP_SELFROLE_EDIT_PICK_PREFIX = 'setup:selfrole:edit:pick:';
export const SETUP_SELFROLE_EDIT_MODAL_PREFIX = 'setup:selfrole:modal:edit:';
export const SETUP_SELFROLE_BUTTONS_BUTTON = 'setup:selfrole:buttons';
export const SETUP_SELFROLE_BUTTONS_BACK_BUTTON = 'setup:selfrole:buttons:back';
export const SETUP_SELFROLE_BUTTONS_PICK_PREFIX = 'setup:selfrole:buttons:pick:';
export const SETUP_SELFROLE_SEND_BUTTON = 'setup:selfrole:send';
export const SETUP_SELFROLE_ADD_MODAL = 'setup:selfrole:modal:add';
export const SETUP_SELFROLE_REMOVE_MODAL = 'setup:selfrole:modal:remove';
export const SETUP_SELFROLE_SEND_MODAL = 'setup:selfrole:modal:send';
export const SETUP_SELFROLE_BUTTON_ADD_PREFIX = 'setup:selfrole:button:add:';
export const SETUP_SELFROLE_BUTTON_REMOVE_PREFIX = 'setup:selfrole:button:remove:';
export const SETUP_SELFROLE_BUTTON_ADD_MODAL_PREFIX = 'setup:selfrole:modal:button:add:';
export const SETUP_SELFROLE_BUTTON_REMOVE_MODAL_PREFIX = 'setup:selfrole:modal:button:remove:';
export const SELFROLE_TOGGLE_PREFIX = 'setup:selfrole:toggle:';
export const SELFROLE_SELECT_ID = 'setup:selfrole:select';

export const MAX_SELFROLE_PANEL_ROLES = 25;

export function selfRoleModeLabel(mode: SelfRoleMode): string {
  return mode === 'single' ? 'Single Role' : 'Multiple Roles';
}

function selfRoleSectionLine(section: SelfRoleSection): string {
  return `- **${section.name}** \`${selfRoleModeLabel(section.mode)}\` — **${section.buttons.length}/${MAX_SELFROLE_BUTTONS}** roles`;
}

export function selfRoleSectionsView(sections: readonly SelfRoleSection[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Self Roles'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`__${sections.length}/${MAX_SELFROLE_SECTIONS} sections__`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(sections.length ? sections.map(selfRoleSectionLine).join('\n') : '- No sections yet. Use **Add** to create one.'),
    );
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(SETUP_SELFROLE_ADD_BUTTON)
        .setLabel('Add')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(sections.length >= MAX_SELFROLE_SECTIONS),
      new ButtonBuilder()
        .setCustomId(SETUP_SELFROLE_REMOVE_BUTTON)
        .setLabel('Remove')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(sections.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_SELFROLE_EDIT_BUTTON)
        .setLabel('Edit')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(sections.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_SELFROLE_BUTTONS_BUTTON)
        .setLabel('Buttons')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(sections.length === 0),
      new ButtonBuilder()
        .setCustomId(SETUP_SELFROLE_SEND_BUTTON)
        .setLabel('Send')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(sections.length === 0),
    ),
  );
  return toPayload(container);
}

function selfRolePickButton(prefix: string, section: SelfRoleSection): ButtonBuilder {
  return new ButtonBuilder().setCustomId(`${prefix}${section.id}`).setLabel(section.name.slice(0, 80)).setStyle(ButtonStyle.Secondary);
}

export function selfRoleEditPickerView(sections: readonly SelfRoleSection[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Edit Self Role Section'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('- __Choose which section to edit.__'));
  for (const row of chunk(sections, 5)) {
    container
      .addSeparatorComponents(sep())
      .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(row.map((section) => selfRolePickButton(SETUP_SELFROLE_EDIT_PICK_PREFIX, section))));
  }
  container
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(SETUP_SELFROLE_EDIT_BACK_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary)),
    );
  return toPayload(container);
}

export function selfRoleButtonsPickerView(sections: readonly SelfRoleSection[]): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text('## Manage Section Roles'))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text('- __Choose which section to manage.__'));
  for (const row of chunk(sections, 5)) {
    container
      .addSeparatorComponents(sep())
      .addActionRowComponents(new ActionRowBuilder<ButtonBuilder>().addComponents(row.map((section) => selfRolePickButton(SETUP_SELFROLE_BUTTONS_PICK_PREFIX, section))));
  }
  container
    .addSeparatorComponents(sep())
    .addActionRowComponents(
      new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(SETUP_SELFROLE_BUTTONS_BACK_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary),
      ),
    );
  return toPayload(container);
}

function selfRoleButtonLine(button: SelfRoleButton, index: number): string {
  const emoji = button.emoji ? `${button.emoji} ` : '';
  return `**${index + 1}.** ${emoji}<@&${button.roleId}> — \`${button.label}\``;
}

export function selfRoleSectionButtonsView(section: SelfRoleSection): ReplyPayload {
  const lines = section.buttons.length
    ? section.buttons.map((button, index) => selfRoleButtonLine(button, index)).join('\n')
    : '- No roles yet. Use **Add Role** to create one.';
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(text(`## ${section.name} — Roles`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(`**${section.buttons.length}/${MAX_SELFROLE_BUTTONS}**`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(text(lines));
  container.addSeparatorComponents(sep()).addActionRowComponents(
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(`${SETUP_SELFROLE_BUTTON_ADD_PREFIX}${section.id}`)
        .setLabel('Add Role')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(section.buttons.length >= MAX_SELFROLE_BUTTONS),
      new ButtonBuilder()
        .setCustomId(`${SETUP_SELFROLE_BUTTON_REMOVE_PREFIX}${section.id}`)
        .setLabel('Remove Role')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(section.buttons.length === 0),
      new ButtonBuilder().setCustomId(SETUP_SELFROLE_BUTTONS_BUTTON).setLabel('Back').setStyle(ButtonStyle.Secondary),
    ),
  );
  return toPayload(container);
}

function selfRoleButton(sectionId: string, button: SelfRoleButton): ButtonBuilder {
  const btn = new ButtonBuilder().setCustomId(`${SELFROLE_TOGGLE_PREFIX}${sectionId}:${button.roleId}`).setLabel(button.label.slice(0, 80)).setStyle(ButtonStyle.Secondary);
  const emoji = parsedEmoji(button.emoji);
  if (emoji) btn.setEmoji(emoji);
  return btn;
}

interface MergedSelfRole {
  sectionId: string;
  sectionName: string;
  sectionMode: SelfRoleMode;
  button: SelfRoleButton;
}

export function mergeSelfRoleSections(sections: readonly SelfRoleSection[]): MergedSelfRole[] {
  const seen = new Set<string>();
  const merged: MergedSelfRole[] = [];
  for (const section of sections) {
    for (const button of section.buttons) {
      if (seen.has(button.roleId)) continue;
      seen.add(button.roleId);
      merged.push({ sectionId: section.id, sectionName: section.name, sectionMode: section.mode, button });
    }
  }
  return merged;
}

function selfRoleSelectOption(entry: MergedSelfRole): StringSelectMenuOptionBuilder {
  const option = new StringSelectMenuOptionBuilder()
    .setLabel(entry.button.label.slice(0, 100))
    .setValue(`${entry.sectionId}:${entry.button.roleId}`)
    .setDescription(`${entry.sectionName} — ${selfRoleModeLabel(entry.sectionMode)}`.slice(0, 100));
  const emoji = parsedEmoji(entry.button.emoji);
  if (emoji) option.setEmoji(emoji);
  return option;
}

export function selfRolePanel(
  guildName: string,
  guildIconURL: string | null,
  sections: readonly SelfRoleSection[],
  panelStyle: SelfRolePanelStyle,
  panelInteraction: SelfRolePanelInteraction,
): ReplyPayload {
  const merged = mergeSelfRoleSections(sections);
  const first = sections[0];
  const title = sections.length === 1 && first ? first.name : 'Self Roles';
  const customDescription = sections
    .map((section) => section.description?.trim())
    .filter((value): value is string => Boolean(value))
    .join('\n\n');
  const accentColor = first?.color ? Number.parseInt(first.color.replace('#', ''), 16) : config.color;
  const imageURLs = [...new Set(sections.map((section) => section.imageURL).filter((value): value is string => Boolean(value)))];

  const components: ActionRowBuilder<ButtonBuilder | StringSelectMenuBuilder>[] =
    panelInteraction === 'select_menu'
      ? [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(SELFROLE_SELECT_ID)
              .setPlaceholder('Select roles to claim')
              .setMinValues(0)
              .setMaxValues(merged.length)
              .addOptions(merged.map(selfRoleSelectOption)),
          ),
        ]
      : chunk(merged, 5).map(
          (group) => new ActionRowBuilder<ButtonBuilder>().addComponents(group.map((entry) => selfRoleButton(entry.sectionId, entry.button))),
        );

  if (panelStyle === 'embed') {
    const embed = {
      title: `${guildName} • ${title}`,
      ...(customDescription && { description: customDescription }),
      color: accentColor,
      footer: { text: `${guildName} • Self Roles` },
      ...(imageURLs[0] ? { image: { url: imageURLs[0] } } : {}),
    };
    return { embeds: [embed], components: components.map((row) => row.toJSON()), allowedMentions: { parse: [] } };
  }

  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addSectionComponents(panelIntroSection(guildIconURL, `## ${guildName} • ${title}`, ...(customDescription ? [customDescription] : [])))
    .addSeparatorComponents(sep());
  if (imageURLs.length) {
    container
      .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(imageURLs.map((url) => new MediaGalleryItemBuilder().setURL(url))))
      .addSeparatorComponents(sep());
  }
  for (const row of components) {
    container.addActionRowComponents(row);
  }
  return toPayload(container);
}

export interface SelfRoleLogEntry {
  memberId: string;
  roleId: string;
  sectionName: string;
  added: boolean;
  at: number;
}

export function selfRoleLogCard(accentColor: number, entry: SelfRoleLogEntry): ReplyPayload {
  const container = new ContainerBuilder()
    .setAccentColor(accentColor)
    .addTextDisplayComponents(text(`## Self Role ${entry.added ? 'Added' : 'Removed'}`))
    .addSeparatorComponents(sep())
    .addTextDisplayComponents(
      text(
        [
          `- __Member__ ﹕ <@${entry.memberId}>`,
          `- __Role__ ﹕ <@&${entry.roleId}>`,
          `- __Section__ ﹕ **${entry.sectionName}**`,
          `- __Time__ ﹕ <t:${Math.floor(entry.at / 1000)}:R>`,
        ].join('\n'),
      ),
    );
  return toPayload(container);
}
