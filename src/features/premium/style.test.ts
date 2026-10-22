import fs from 'node:fs';
import path from 'node:path';
import { GlobalFonts, createCanvas, type SKRSContext2D } from '@napi-rs/canvas';
import {
  ContainerBuilder,
  LabelBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  MessageFlags,
  ModalBuilder,
  SeparatorBuilder,
  StringSelectMenuOptionBuilder,
  TextDisplayBuilder,
  TextInputStyle,
} from 'discord.js';
import config from '../../core/config';
import type { ReplyPayload } from '../../core/context';
import { EFFECTS, FONTS } from './style.ui';

export const STYLE_TEST_MODAL_PREFIX = 'gpstyle_testmodal:';

const WIDTH = 900;
const HEIGHT = 260;
const FONT_SIZE = 96;
const HEX_COLOR = /^#?([0-9a-f]{6})$/i;

const FONT_FILES: Record<string, { file: string; family: string }> = {
  blackletter: { file: 'Blackletter.ttf', family: 'GPBlackletter' },
  metalgothic: { file: 'MetalGothic.ttf', family: 'GPMetalGothic' },
  april: { file: 'AprilFont.ttf', family: 'GPApril' },
  patrick: { file: 'PatrickHand-Regular.ttf', family: 'GPPatrick' },
  raleway: { file: 'Raleway.ttf', family: 'GPRaleway' },
};

const FONT_STACKS: Record<string, string> = {
  bangers: `bold ${FONT_SIZE}px Impact, "Arial Black", sans-serif`,
  biorhyme: `${FONT_SIZE}px Georgia, serif`,
  cherrybomb: `${FONT_SIZE}px GPPatrick, "Comic Sans MS", sans-serif`,
  chicle: `bold ${FONT_SIZE}px GPPatrick, "Comic Sans MS", sans-serif`,
  compagnon: `bold ${FONT_SIZE}px GPRaleway, sans-serif`,
  museomoderno: `${FONT_SIZE}px GPRaleway, sans-serif`,
  neocastel: `${FONT_SIZE}px GPMetalGothic, serif`,
  pixelify: `bold ${FONT_SIZE}px "Courier New", monospace`,
  ribes: `${FONT_SIZE}px GPApril, serif`,
  sinistre: `${FONT_SIZE}px GPBlackletter, serif`,
  default: `${FONT_SIZE}px Arial, sans-serif`,
  zillaslab: `bold ${FONT_SIZE}px Rockwell, Georgia, serif`,
};

let fontsLoaded = false;

function loadFonts(): void {
  if (fontsLoaded) return;
  fontsLoaded = true;
  for (const font of Object.values(FONT_FILES)) {
    const fullPath = path.join(config.root, 'assets', 'fonts', font.file);
    if (fs.existsSync(fullPath)) GlobalFonts.registerFromPath(fullPath, font.family);
  }
}

export interface StyleTestInput {
  fontId: number;
  effectId: number;
  colors: string[];
}

export function parseColor(raw: string): string | null {
  const match = HEX_COLOR.exec(raw.trim());
  return match ? `#${match[1]}` : null;
}

function drawText(context: SKRSContext2D, effectKey: string, name: string, colors: readonly string[], x: number, y: number, width: number): void {
  const first = colors[0] ?? '#ffffff';
  const second = colors[1] ?? first;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  if (effectKey === 'gradient') {
    const gradient = context.createLinearGradient(x - width / 2, 0, x + width / 2, 0);
    gradient.addColorStop(0, first);
    gradient.addColorStop(1, second);
    context.fillStyle = gradient;
    context.fillText(name, x, y);
  } else if (effectKey === 'neon') {
    context.shadowColor = first;
    context.shadowBlur = 28;
    context.lineWidth = 4;
    context.strokeStyle = first;
    context.strokeText(name, x, y);
    context.shadowBlur = 10;
    context.fillStyle = '#ffffff';
    context.fillText(name, x, y);
  } else if (effectKey === 'toon') {
    context.lineWidth = 10;
    context.lineJoin = 'round';
    context.strokeStyle = second;
    context.strokeText(name, x, y);
    context.fillStyle = first;
    context.fillText(name, x, y);
  } else if (effectKey === 'pop') {
    context.fillStyle = first;
    context.fillText(name, x + 6, y + 6);
    context.fillStyle = '#ffffff';
    context.fillText(name, x, y);
  } else if (effectKey === 'glow') {
    context.shadowColor = second;
    context.shadowBlur = 32;
    context.fillStyle = first;
    context.fillText(name, x, y);
    context.shadowBlur = 12;
    context.fillText(name, x, y);
  } else {
    context.fillStyle = first;
    context.fillText(name, x, y);
  }
}

export function renderStylePreview(name: string, input: StyleTestInput): Buffer {
  loadFonts();
  const font = FONTS.find((candidate) => candidate.id === input.fontId) ?? FONTS[10];
  const effect = EFFECTS.find((candidate) => candidate.id === input.effectId) ?? EFFECTS[0];
  const canvas = createCanvas(WIDTH, HEIGHT);
  const context = canvas.getContext('2d');
  context.fillStyle = '#000000';
  context.fillRect(0, 0, WIDTH, HEIGHT);
  context.font = FONT_STACKS[font.key] ?? FONT_STACKS.default ?? '';
  const width = Math.min(WIDTH - 80, context.measureText(name).width);
  drawText(context, effect.key, name, input.colors, WIDTH / 2, HEIGHT / 2, width);
  return canvas.toBuffer('image/png');
}

export function buildStyleTestModal(ownerId: string): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(`${STYLE_TEST_MODAL_PREFIX}${ownerId}`)
    .setTitle('Test a Name Style')
    .addLabelComponents(
      new LabelBuilder().setLabel('Font').setStringSelectMenuComponent((select) => {
        select.setCustomId('font').setPlaceholder('Choose a font').setMinValues(1).setMaxValues(1);
        for (const font of FONTS) select.addOptions(new StringSelectMenuOptionBuilder().setLabel(font.label).setValue(String(font.id)).setDescription(font.feel.slice(0, 100)));
        return select;
      }),
      new LabelBuilder().setLabel('Effect').setStringSelectMenuComponent((select) => {
        select.setCustomId('effect').setPlaceholder('Choose an effect').setMinValues(1).setMaxValues(1);
        for (const effect of EFFECTS) select.addOptions(new StringSelectMenuOptionBuilder().setLabel(effect.key[0]?.toUpperCase() + effect.key.slice(1)).setValue(String(effect.id)).setDescription(effect.feel.slice(0, 100)));
        return select;
      }),
      new LabelBuilder().setLabel('Color').setDescription('Six letters or numbers, the # is optional').setTextInputComponent((input) =>
        input.setCustomId('color1').setStyle(TextInputStyle.Short).setMinLength(6).setMaxLength(7).setRequired(true).setPlaceholder('ff00ff'),
      ),
      new LabelBuilder().setLabel('Second color').setDescription('Needed for the Gradient effect').setTextInputComponent((input) =>
        input.setCustomId('color2').setStyle(TextInputStyle.Short).setMaxLength(7).setRequired(false).setPlaceholder('800080'),
      ),
    );
}

export function styleTestPayload(name: string, input: StyleTestInput): ReplyPayload {
  const font = FONTS.find((candidate) => candidate.id === input.fontId) ?? FONTS[10];
  const effect = EFFECTS.find((candidate) => candidate.id === input.effectId) ?? EFFECTS[0];
  const container = new ContainerBuilder()
    .setAccentColor(config.color)
    .addTextDisplayComponents(new TextDisplayBuilder().setContent('# Style Preview'))
    .addSeparatorComponents(new SeparatorBuilder())
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        [
          `- __Font__ ﹕ \`${font.label}\``,
          `- __Effect__ ﹕ \`${effect.key}\``,
          `- __Colors__ ﹕ ${input.colors.map((color) => `\`${color}\``).join(' ')}`,
        ].join('\n'),
      ),
    )
    .addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL('attachment://style-preview.png')));
  return {
    components: [container.toJSON()],
    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
    files: [{ attachment: renderStylePreview(name, input), name: 'style-preview.png' }],
    allowedMentions: { parse: [] },
  };
}
