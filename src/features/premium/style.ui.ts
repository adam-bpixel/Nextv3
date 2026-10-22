import { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags, type APIMessageTopLevelComponent } from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { dividerComponent, dividerFile } from '../../core/divider';
import { ARROW_LEFT_GOLD, ARROW_RIGHT_GOLD } from '../../core/emojis';
import { cachedColor } from '../theme/theme.model';

export const STYLE_SELECT_ID = 'gpstyle_select:';
export const STYLE_NAV_PREFIX = 'gpstyle_nav:';
export const STYLE_TEST_BUTTON_PREFIX = 'gpstyle_test:';

const SEPARATOR = { type: 14, spacing: 1, divider: true };
const SUMMARY = 'summary';

export const FONTS = [
  { id: 1, key: 'bangers', label: 'Bold Comic', feel: 'thick comic-book lettering' },
  { id: 2, key: 'biorhyme', label: 'Elegant Serif', feel: 'classic, refined serif' },
  { id: 3, key: 'cherrybomb', label: 'Sakura', feel: 'playful bubble characters' },
  { id: 4, key: 'chicle', label: 'Jellybean', feel: 'rounded, soft and bubbly' },
  { id: 5, key: 'compagnon', label: 'Display', feel: 'stylish mixed-weight display' },
  { id: 6, key: 'museomoderno', label: 'Modern', feel: 'clean, geometric' },
  { id: 7, key: 'neocastel', label: 'Medieval', feel: 'gothic medieval lettering' },
  { id: 8, key: 'pixelify', label: '8Bit', feel: 'retro pixel characters' },
  { id: 9, key: 'ribes', label: 'Decorative', feel: 'expressive display' },
  { id: 10, key: 'sinistre', label: 'Vampyre', feel: 'dark, jagged, gothic' },
  { id: 11, key: 'default', label: 'Default', feel: "Discord's standard font" },
  { id: 12, key: 'zillaslab', label: 'Tempo', feel: 'modern slab-serif' },
] as const;

export const EFFECTS = [
  { id: 1, key: 'solid', feel: 'a flat single color', colors: '1 color' },
  { id: 2, key: 'gradient', feel: 'a blend from the first color to the second', colors: '2 colors (required)' },
  { id: 3, key: 'neon', feel: 'a glowing outline around the letters', colors: '1 color' },
  { id: 4, key: 'toon', feel: 'a soft gradient fill with a stroke outline', colors: '1 color' },
  { id: 5, key: 'pop', feel: 'a colored drop shadow behind the letters', colors: '1 color' },
  { id: 6, key: 'glow', feel: 'a soft outer glow', colors: '1 color, a 2nd is the accent' },
] as const;

export const FONT_IDS: Record<string, number> = Object.fromEntries(FONTS.map((f) => [f.key, f.id]));
export const EFFECT_IDS: Record<string, number> = Object.fromEntries(EFFECTS.map((e) => [e.key, e.id]));

const FONT_START = 1;
const EFFECT_START = FONT_START + FONTS.length;
const TOTAL = EFFECT_START + EFFECTS.length;

const sectionOf = (index: number): string => (index < FONT_START ? SUMMARY : index < EFFECT_START ? 'fonts' : 'effects');
const START_OF: Record<string, number> = { summary: 0, fonts: FONT_START, effects: EFFECT_START };
const rangeOf = (index: number): [number, number] => (index < EFFECT_START ? [FONT_START, EFFECT_START - 1] : [EFFECT_START, TOTAL - 1]);

function accentColor(guildId?: string | null): number {
  return (guildId ? cachedColor(guildId) : undefined) ?? config.color;
}

function container(components: object[], accent: number): APIMessageTopLevelComponent[] {
  return [{ type: 17, accent_color: accent, spoiler: false, components }] as unknown as APIMessageTopLevelComponent[];
}

export function styleNavCustomId(ownerId: string, page: number): string {
  return `${STYLE_NAV_PREFIX}${ownerId}:${page}`;
}

export function parseStyleNavCustomId(customId: string): { ownerId: string; page: number } | null {
  const [ownerId, pageText] = customId.slice(STYLE_NAV_PREFIX.length).split(':');
  const page = Number(pageText);
  if (!ownerId || !Number.isFinite(page)) return null;
  return { ownerId, page };
}

function summaryPage(botName: string, prefix: string): object[] {
  return [
    { type: 10, content: `# ${botName} Name Styles` },
    SEPARATOR,
    {
      type: 10,
      content: [
        `- -# **__Usage__** · \`${prefix}gp style <color> [color2] [font] [effect]\``,
        `- -# **__Reset__** · \`${prefix}gp style reset\``,
        `- -# **__Example__** · \`${prefix}gp style ffffff 10 3\``,
      ].join('\n'),
    },
  ];
}

function fontPage(font: (typeof FONTS)[number]): object[] {
  return [
    { type: 10, content: `# Font: ${font.label}` },
    SEPARATOR,
    {
      type: 10,
      content: [`- __Number__ : \`${font.id}\``, `- __Word__ : \`${font.key}\``, `- __Look__ : ${font.feel}`].join('\n'),
    },
  ];
}

function effectPage(effect: (typeof EFFECTS)[number]): object[] {
  const name = `${effect.key[0]?.toUpperCase()}${effect.key.slice(1)}`;
  return [
    { type: 10, content: `# Effect: ${name}` },
    SEPARATOR,
    {
      type: 10,
      content: [
        `- __Number__ : \`${effect.id}\``,
        `- __Word__ : \`${effect.key}\``,
        `- __Look__ : ${effect.feel}`,
        `- __Colors__ : ${effect.colors}`,
      ].join('\n'),
    },
  ];
}

function pageParts(index: number, botName: string, prefix: string): object[] {
  if (index < FONT_START) return summaryPage(botName, prefix);
  if (index < EFFECT_START) return fontPage(FONTS[index - FONT_START]!);
  return effectPage(EFFECTS[index - EFFECT_START]!);
}

function selectRow(ownerId: string, index: number): object {
  const current = sectionOf(index);
  const option = (value: string, label: string, description: string) => ({ label, value, description, default: value === current });
  return {
    type: 1,
    components: [
      {
        type: 3,
        custom_id: `${STYLE_SELECT_ID}${ownerId}`,
        placeholder: 'Select a page',
        min_values: 1,
        max_values: 1,
        options: [
          option('fonts', 'Fonts', 'All 12 fonts, one per page'),
          option('effects', 'Effects', 'All 6 effects, one per page'),
          option(SUMMARY, 'Back to summary', 'How to use the style command'),
        ],
      },
    ],
  };
}

function navRow(ownerId: string, index: number): ActionRowBuilder<ButtonBuilder> {
  const [low, high] = rangeOf(index);
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(styleNavCustomId(ownerId, index - 1)).setEmoji(ARROW_LEFT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(index <= low),
    new ButtonBuilder().setCustomId(styleNavCustomId(ownerId, index + 1)).setEmoji(ARROW_RIGHT_GOLD).setStyle(ButtonStyle.Secondary).setDisabled(index >= high),
    new ButtonBuilder().setCustomId(`${STYLE_TEST_BUTTON_PREFIX}${ownerId}`).setLabel('Test').setStyle(ButtonStyle.Secondary),
  );
}

export function styleHelpPayload(ownerId: string, botName: string, prefix: string, index = 0, guildId?: string | null): ReplyPayload {
  const safeIndex = Math.min(Math.max(index, 0), TOTAL - 1);
  const rows =
    safeIndex === 0
      ? [SEPARATOR, dividerComponent(), selectRow(ownerId, safeIndex)]
      : [SEPARATOR, selectRow(ownerId, safeIndex), SEPARATOR, navRow(ownerId, safeIndex).toJSON()];
  const [low, high] = rangeOf(safeIndex);
  return {
    flags: MessageFlags.IsComponentsV2,
    allowedMentions: { parse: [] },
    ...(safeIndex === 0 ? { files: [dividerFile()] } : {}),
    components: container(
      [
        ...pageParts(safeIndex, botName, prefix),
        ...(safeIndex === 0 ? [] : [SEPARATOR, { type: 10, content: `-# Page ${safeIndex - low + 1} / ${high - low + 1}` }]),
        ...rows,
      ],
      accentColor(guildId),
    ),
  };
}

export function styleHelpStartIndex(section: string): number {
  return START_OF[section] ?? 0;
}
