import { ButtonStyle, ComponentType, SeparatorSpacingSize, TextInputStyle } from 'discord.js';
import type {
  APIActionRowComponent,
  APIButtonComponent,
  APIButtonComponentWithCustomId,
  APIButtonComponentWithURL,
  APIComponentInContainer,
  APIComponentInMessageActionRow,
  APIContainerComponent,
  APIEmbed,
  APIMediaGalleryComponent,
  APIMediaGalleryItem,
  APIMessageComponentEmoji,
  APIMessageTopLevelComponent,
  APISectionAccessoryComponent,
  APISectionComponent,
  APISelectMenuOption,
  APISeparatorComponent,
  APIStringSelectComponent,
  APITextDisplayComponent,
  APITextInputComponent,
  APIThumbnailComponent,
  APIUnfurledMediaItem,
} from 'discord.js';
import {
  InvalidDataError,
  assertOnlyKeys,
  isRecord,
  readArray,
  readNumber,
  readObject,
  readOptionalBoolean,
  readOptionalNumber,
  readOptionalString,
  readString,
  type JsonObject,
  type JsonValue,
} from '../../core/json';

const MEDIA_KEYS_DISCORD_FILLS_IN = ['content_scan_metadata'] as const;

function numericMembers<E extends number>(enumObject: Record<string, string | E>): ReadonlyMap<number, E> {
  return new Map(
    Object.values(enumObject)
      .filter((value): value is E => typeof value === 'number')
      .map((value) => [value, value]),
  );
}

const COMPONENT_TYPES = numericMembers<ComponentType>(ComponentType);
const BUTTON_STYLES = numericMembers<ButtonStyle>(ButtonStyle);
const SEPARATOR_SPACINGS = numericMembers<SeparatorSpacingSize>(SeparatorSpacingSize);
const TEXT_INPUT_STYLES = numericMembers<TextInputStyle>(TextInputStyle);

function memberOf<E extends number>(members: ReadonlyMap<number, E>, value: number, where: string, expected: string): E {
  const member = members.get(value);
  if (member === undefined) throw new InvalidDataError(where, expected);
  return member;
}

function setIfDefined<T, K extends keyof T>(target: T, key: K, value: T[K] | undefined): void {
  if (value !== undefined) target[key] = value;
}

function asObject(value: JsonValue, where: string): JsonObject {
  if (!isRecord(value)) throw new InvalidDataError(where, 'an object');
  return value;
}

function typeOf(source: JsonObject, where: string): ComponentType {
  return memberOf(COMPONENT_TYPES, readNumber(source, 'type', where), `${where}.type`, 'a component type');
}

function nullableString(source: JsonObject, key: string, where: string): string | null | undefined {
  return source[key] === null ? null : readOptionalString(source, key, where);
}

function nullableNumber(source: JsonObject, key: string, where: string): number | null | undefined {
  return source[key] === null ? null : readOptionalNumber(source, key, where);
}

function toEmoji(source: JsonObject, where: string): APIMessageComponentEmoji {
  assertOnlyKeys(source, ['id', 'name', 'animated'], where);
  const emoji: APIMessageComponentEmoji = {};
  setIfDefined(emoji, 'id', readOptionalString(source, 'id', where));
  setIfDefined(emoji, 'name', readOptionalString(source, 'name', where));
  setIfDefined(emoji, 'animated', readOptionalBoolean(source, 'animated', where));
  return emoji;
}

function optionalEmoji(source: JsonObject, where: string): APIMessageComponentEmoji | undefined {
  return source.emoji === undefined ? undefined : toEmoji(readObject(source, 'emoji', where), `${where}.emoji`);
}

function toMedia(source: JsonObject, where: string): APIUnfurledMediaItem {
  assertOnlyKeys(source, ['url', ...MEDIA_KEYS_DISCORD_FILLS_IN], where);
  return { url: readString(source, 'url', where) };
}

const CUSTOM_ID_BUTTON_STYLES = [ButtonStyle.Primary, ButtonStyle.Secondary, ButtonStyle.Success, ButtonStyle.Danger] as const;
type CustomIdButtonStyle = (typeof CUSTOM_ID_BUTTON_STYLES)[number];

function isCustomIdButtonStyle(style: ButtonStyle): style is CustomIdButtonStyle {
  return CUSTOM_ID_BUTTON_STYLES.some((allowed) => allowed === style);
}

function toButton(source: JsonObject, where: string): APIButtonComponent {
  assertOnlyKeys(source, ['type', 'style', 'label', 'emoji', 'custom_id', 'url', 'disabled'], where);
  const style = memberOf(BUTTON_STYLES, readNumber(source, 'style', where), `${where}.style`, 'a button style');
  const label = readOptionalString(source, 'label', where);
  const emoji = optionalEmoji(source, where);
  const disabled = readOptionalBoolean(source, 'disabled', where);
  if (style === ButtonStyle.Link) {
    const link: APIButtonComponentWithURL = { type: ComponentType.Button, style: ButtonStyle.Link, url: readString(source, 'url', where) };
    setIfDefined(link, 'label', label);
    setIfDefined(link, 'emoji', emoji);
    setIfDefined(link, 'disabled', disabled);
    return link;
  }
  if (!isCustomIdButtonStyle(style)) throw new InvalidDataError(`${where}.style`, 'a supported button style');
  const button: APIButtonComponentWithCustomId = { type: ComponentType.Button, style, custom_id: readString(source, 'custom_id', where) };
  setIfDefined(button, 'label', label);
  setIfDefined(button, 'emoji', emoji);
  setIfDefined(button, 'disabled', disabled);
  return button;
}

function toSelectOption(value: JsonValue, where: string): APISelectMenuOption {
  const source = asObject(value, where);
  assertOnlyKeys(source, ['label', 'value', 'description', 'emoji', 'default'], where);
  const option: APISelectMenuOption = { label: readString(source, 'label', where), value: readString(source, 'value', where) };
  setIfDefined(option, 'description', readOptionalString(source, 'description', where));
  setIfDefined(option, 'emoji', optionalEmoji(source, where));
  setIfDefined(option, 'default', readOptionalBoolean(source, 'default', where));
  return option;
}

function toStringSelect(source: JsonObject, where: string): APIStringSelectComponent {
  assertOnlyKeys(source, ['type', 'custom_id', 'placeholder', 'min_values', 'max_values', 'options', 'disabled'], where);
  const select: APIStringSelectComponent = {
    type: ComponentType.StringSelect,
    custom_id: readString(source, 'custom_id', where),
    options: readArray(source, 'options', where).map((option, index) => toSelectOption(option, `${where}.options[${index}]`)),
  };
  setIfDefined(select, 'placeholder', readOptionalString(source, 'placeholder', where));
  setIfDefined(select, 'min_values', readOptionalNumber(source, 'min_values', where));
  setIfDefined(select, 'max_values', readOptionalNumber(source, 'max_values', where));
  setIfDefined(select, 'disabled', readOptionalBoolean(source, 'disabled', where));
  return select;
}

function toActionRowChild(value: JsonValue, where: string): APIComponentInMessageActionRow {
  const source = asObject(value, where);
  const type = typeOf(source, where);
  if (type === ComponentType.Button) return toButton(source, where);
  if (type === ComponentType.StringSelect) return toStringSelect(source, where);
  throw new InvalidDataError(`${where}.type`, 'a button or a string select');
}

function toActionRow(source: JsonObject, where: string): APIActionRowComponent<APIComponentInMessageActionRow> {
  assertOnlyKeys(source, ['type', 'components'], where);
  return {
    type: ComponentType.ActionRow,
    components: readArray(source, 'components', where).map((child, index) => toActionRowChild(child, `${where}.components[${index}]`)),
  };
}

function toTextDisplay(source: JsonObject, where: string): APITextDisplayComponent {
  assertOnlyKeys(source, ['type', 'content'], where);
  if (typeOf(source, where) !== ComponentType.TextDisplay) throw new InvalidDataError(`${where}.type`, 'a text display');
  return { type: ComponentType.TextDisplay, content: readString(source, 'content', where) };
}

function toSeparatorSpacing(value: number | undefined, where: string): SeparatorSpacingSize | undefined {
  return value === undefined ? undefined : memberOf(SEPARATOR_SPACINGS, value, `${where}.spacing`, 'a separator spacing size');
}

function toSeparator(source: JsonObject, where: string): APISeparatorComponent {
  assertOnlyKeys(source, ['type', 'divider', 'spacing'], where);
  const separator: APISeparatorComponent = { type: ComponentType.Separator };
  setIfDefined(separator, 'divider', readOptionalBoolean(source, 'divider', where));
  setIfDefined(separator, 'spacing', toSeparatorSpacing(readOptionalNumber(source, 'spacing', where), where));
  return separator;
}

function toThumbnail(source: JsonObject, where: string): APIThumbnailComponent {
  assertOnlyKeys(source, ['type', 'media', 'description', 'spoiler'], where);
  const thumbnail: APIThumbnailComponent = { type: ComponentType.Thumbnail, media: toMedia(readObject(source, 'media', where), `${where}.media`) };
  setIfDefined(thumbnail, 'description', nullableString(source, 'description', where));
  setIfDefined(thumbnail, 'spoiler', readOptionalBoolean(source, 'spoiler', where));
  return thumbnail;
}

function toSectionAccessory(source: JsonObject, where: string): APISectionAccessoryComponent {
  const type = typeOf(source, where);
  if (type === ComponentType.Thumbnail) return toThumbnail(source, where);
  if (type === ComponentType.Button) return toButton(source, where);
  throw new InvalidDataError(`${where}.type`, 'a thumbnail or a button');
}

function toSection(source: JsonObject, where: string): APISectionComponent {
  assertOnlyKeys(source, ['type', 'components', 'accessory'], where);
  return {
    type: ComponentType.Section,
    components: readArray(source, 'components', where).map((child, index) => {
      const childWhere = `${where}.components[${index}]`;
      return toTextDisplay(asObject(child, childWhere), childWhere);
    }),
    accessory: toSectionAccessory(readObject(source, 'accessory', where), `${where}.accessory`),
  };
}

function toGalleryItem(value: JsonValue, where: string): APIMediaGalleryItem {
  const source = asObject(value, where);
  assertOnlyKeys(source, ['media', 'description', 'spoiler'], where);
  const item: APIMediaGalleryItem = { media: toMedia(readObject(source, 'media', where), `${where}.media`) };
  setIfDefined(item, 'description', nullableString(source, 'description', where));
  setIfDefined(item, 'spoiler', readOptionalBoolean(source, 'spoiler', where));
  return item;
}

function toMediaGallery(source: JsonObject, where: string): APIMediaGalleryComponent {
  assertOnlyKeys(source, ['type', 'items'], where);
  return {
    type: ComponentType.MediaGallery,
    items: readArray(source, 'items', where).map((item, index) => toGalleryItem(item, `${where}.items[${index}]`)),
  };
}

function toContainerChild(source: JsonObject, where: string): APIComponentInContainer {
  const type = typeOf(source, where);
  if (type === ComponentType.ActionRow) return toActionRow(source, where);
  if (type === ComponentType.TextDisplay) return toTextDisplay(source, where);
  if (type === ComponentType.Separator) return toSeparator(source, where);
  if (type === ComponentType.Section) return toSection(source, where);
  if (type === ComponentType.MediaGallery) return toMediaGallery(source, where);
  throw new InvalidDataError(`${where}.type`, 'a component allowed inside a container');
}

function toContainer(source: JsonObject, where: string): APIContainerComponent {
  assertOnlyKeys(source, ['type', 'accent_color', 'spoiler', 'components'], where);
  const container: APIContainerComponent = {
    type: ComponentType.Container,
    components: readArray(source, 'components', where).map((child, index) => {
      const childWhere = `${where}.components[${index}]`;
      return toContainerChild(asObject(child, childWhere), childWhere);
    }),
  };
  setIfDefined(container, 'accent_color', nullableNumber(source, 'accent_color', where));
  setIfDefined(container, 'spoiler', readOptionalBoolean(source, 'spoiler', where));
  return container;
}

export function toTopLevelComponent(value: JsonValue, where: string): APIMessageTopLevelComponent {
  const source = asObject(value, where);
  if (typeOf(source, where) === ComponentType.Container) return toContainer(source, where);
  return toContainerChild(source, where);
}

export function toTopLevelComponents(values: readonly JsonValue[], where: string): APIMessageTopLevelComponent[] {
  return values.map((value, index) => toTopLevelComponent(value, `${where}[${index}]`));
}

export function toEmbed(value: JsonValue, where: string): APIEmbed {
  const source = asObject(value, where);
  assertOnlyKeys(source, ['title', 'description', 'url', 'timestamp', 'color'], where);
  const embed: APIEmbed = {};
  setIfDefined(embed, 'title', readOptionalString(source, 'title', where));
  setIfDefined(embed, 'description', readOptionalString(source, 'description', where));
  setIfDefined(embed, 'url', readOptionalString(source, 'url', where));
  setIfDefined(embed, 'timestamp', readOptionalString(source, 'timestamp', where));
  setIfDefined(embed, 'color', readOptionalNumber(source, 'color', where));
  return embed;
}

export function toEmbeds(values: readonly JsonValue[], where: string): APIEmbed[] {
  return values.map((value, index) => toEmbed(value, `${where}[${index}]`));
}

function toTextInputStyle(value: number, where: string): TextInputStyle {
  return memberOf(TEXT_INPUT_STYLES, value, `${where}.style`, 'a text input style');
}

export function toTextInput(value: JsonValue, where: string): APITextInputComponent {
  const source = asObject(value, where);
  assertOnlyKeys(source, ['type', 'custom_id', 'style', 'label', 'placeholder', 'value', 'min_length', 'max_length', 'required'], where);
  if (typeOf(source, where) !== ComponentType.TextInput) throw new InvalidDataError(`${where}.type`, 'a text input');
  const input: APITextInputComponent = {
    type: ComponentType.TextInput,
    custom_id: readString(source, 'custom_id', where),
    style: toTextInputStyle(readNumber(source, 'style', where), where),
  };
  setIfDefined(input, 'label', readOptionalString(source, 'label', where));
  setIfDefined(input, 'placeholder', readOptionalString(source, 'placeholder', where));
  setIfDefined(input, 'value', readOptionalString(source, 'value', where));
  setIfDefined(input, 'min_length', readOptionalNumber(source, 'min_length', where));
  setIfDefined(input, 'max_length', readOptionalNumber(source, 'max_length', where));
  setIfDefined(input, 'required', readOptionalBoolean(source, 'required', where));
  return input;
}
