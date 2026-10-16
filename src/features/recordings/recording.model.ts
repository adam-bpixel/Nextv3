import {
  InvalidDataError,
  assertOnlyKeys,
  isRecord,
  readArray,
  readObject,
  readOptionalArray,
  readOptionalBoolean,
  readOptionalNumber,
  readString,
  type JsonObject,
  type JsonValue,
} from '../../core/json';
import { toEmbeds, toTextInput, toTopLevelComponents } from './components.schema';

export interface RecordedAttachment {
  filename: string;
  url: string;
  local: string | null;
}

export interface Snapshot {
  content: string;
  embeds: JsonValue[];
  components: JsonValue[];
  attachments: RecordedAttachment[];
  v2: boolean;
  reply: boolean;
  ping: boolean;
  ephemeral: boolean;
  primary: boolean;
  flowRef: number | null;
}

export const TRANSITION_KINDS = ['update', 'reply', 'modal', 'none'] as const;
export type TransitionKind = (typeof TRANSITION_KINDS)[number];

export interface Transition {
  from: string;
  customId: string;
  value: string | null;
  global: boolean;
  kind: TransitionKind;
  to: string | null;
  reply: Snapshot[];
  replyFlow: Flow | null;
  modal: JsonObject | null;
}

export interface Flow {
  id: string;
  start: string;
  states: ReadonlyMap<string, Snapshot>;
  transitions: Transition[];
}

export interface Source {
  replies: Snapshot[];
  reactions: string[];
  flow: Flow | null;
  extraFlows: Flow[];
  args: number;
}

export interface Recording extends Source {
  variants: Source[];
  details: ReadonlyMap<string, Snapshot[]>;
  samples: Snapshot[][];
  voiceNotice: Snapshot[];
  permissionNotice: Snapshot[];
}

const SNAPSHOT_KEYS = ['content', 'embeds', 'components', 'attachments', 'v2', 'reply', 'ping', 'ephemeral', 'primary', 'flow_ref'] as const;
const TRANSITION_KEYS = ['from', 'custom_id', 'value', 'global', 'kind', 'to', 'reply', 'reply_flow', 'modal', 'action'] as const;
const FLOW_KEYS = ['id', 'start', 'states', 'transitions'] as const;
const SOURCE_KEYS = ['replies', 'reactions', 'flow', 'extra_flows', 'args', 'kind', 'sample'] as const;
const RECORDING_KEYS = [...SOURCE_KEYS, 'variants', 'details', 'samples', 'voice_notice', 'permission_notice'] as const;

export const EMPTY_RECORDING: Recording = {
  replies: [],
  reactions: [],
  flow: null,
  extraFlows: [],
  args: 0,
  variants: [],
  details: new Map(),
  samples: [],
  voiceNotice: [],
  permissionNotice: [],
};

function asObject(value: JsonValue, where: string): JsonObject {
  if (!isRecord(value)) throw new InvalidDataError(where, 'an object');
  return value;
}

function asString(value: JsonValue, where: string): string {
  if (typeof value !== 'string') throw new InvalidDataError(where, 'a string');
  return value;
}

function nullableString(source: JsonObject, key: string, where: string): string | null {
  const value = source[key];
  if (value === undefined || value === null) return null;
  return asString(value, `${where}.${key}`);
}

function parseAttachment(value: JsonValue, where: string): RecordedAttachment {
  const source = asObject(value, where);
  assertOnlyKeys(source, ['filename', 'url', 'local'], where);
  return { filename: readString(source, 'filename', where), url: readString(source, 'url', where), local: nullableString(source, 'local', where) };
}

function parseSnapshot(value: JsonValue, where: string): Snapshot {
  const source = asObject(value, where);
  assertOnlyKeys(source, SNAPSHOT_KEYS, where);
  const embeds = readOptionalArray(source, 'embeds', where);
  const components = readOptionalArray(source, 'components', where);
  toEmbeds(embeds, `${where}.embeds`);
  toTopLevelComponents(components, `${where}.components`);
  const content = source.content;
  return {
    content: content === undefined || content === null ? '' : asString(content, `${where}.content`),
    embeds,
    components,
    attachments: readOptionalArray(source, 'attachments', where).map((item, index) => parseAttachment(item, `${where}.attachments[${index}]`)),
    v2: readOptionalBoolean(source, 'v2', where) ?? false,
    reply: readOptionalBoolean(source, 'reply', where) ?? false,
    ping: readOptionalBoolean(source, 'ping', where) ?? false,
    ephemeral: readOptionalBoolean(source, 'ephemeral', where) ?? false,
    primary: readOptionalBoolean(source, 'primary', where) ?? false,
    flowRef: source.flow_ref === null ? null : readOptionalNumber(source, 'flow_ref', where) ?? null,
  };
}

function parseSnapshots(values: JsonValue[], where: string): Snapshot[] {
  return values.map((item, index) => parseSnapshot(item, `${where}[${index}]`));
}

function isTransitionKind(value: string): value is TransitionKind {
  return TRANSITION_KINDS.some((kind) => kind === value);
}

function validateModal(modal: JsonObject, where: string): JsonObject {
  readString(modal, 'title', where);
  readString(modal, 'custom_id', where);
  readArray(modal, 'components', where).forEach((row, rowIndex) => {
    const rowWhere = `${where}.components[${rowIndex}]`;
    readArray(asObject(row, rowWhere), 'components', rowWhere).forEach((field, fieldIndex) => toTextInput(field, `${rowWhere}.components[${fieldIndex}]`));
  });
  return modal;
}

function parseTransition(value: JsonValue, where: string): Transition {
  const source = asObject(value, where);
  assertOnlyKeys(source, TRANSITION_KEYS, where);
  const kind = readString(source, 'kind', where);
  if (!isTransitionKind(kind)) throw new InvalidDataError(`${where}.kind`, TRANSITION_KINDS.join(' | '));
  const modal = source.modal === undefined || source.modal === null ? null : validateModal(readObject(source, 'modal', where), `${where}.modal`);
  return {
    from: readString(source, 'from', where),
    customId: readString(source, 'custom_id', where),
    value: nullableString(source, 'value', where),
    global: readOptionalBoolean(source, 'global', where) ?? false,
    kind,
    to: nullableString(source, 'to', where),
    reply: parseSnapshots(readOptionalArray(source, 'reply', where), `${where}.reply`),
    replyFlow: parseOptionalFlow(source.reply_flow, `${where}.reply_flow`),
    modal,
  };
}

function parseFlow(value: JsonValue, where: string): Flow {
  const source = asObject(value, where);
  assertOnlyKeys(source, FLOW_KEYS, where);
  const states = new Map<string, Snapshot>();
  for (const [stateId, snapshot] of Object.entries(readObject(source, 'states', where))) {
    states.set(stateId, parseSnapshot(snapshot, `${where}.states.${stateId}`));
  }
  return {
    id: readString(source, 'id', where),
    start: readString(source, 'start', where),
    states,
    transitions: readArray(source, 'transitions', where).map((item, index) => parseTransition(item, `${where}.transitions[${index}]`)),
  };
}

function parseOptionalFlow(value: JsonValue | undefined, where: string): Flow | null {
  return value === undefined || value === null ? null : parseFlow(value, where);
}

function parseExtraFlow(value: JsonValue, where: string): Flow {
  const source = asObject(value, where);
  return parseFlow(readObject(source, 'flow', where), `${where}.flow`);
}

function parseSource(source: JsonObject, where: string): Source {
  return {
    replies: parseSnapshots(readOptionalArray(source, 'replies', where), `${where}.replies`),
    reactions: readOptionalArray(source, 'reactions', where).map((item, index) => asString(item, `${where}.reactions[${index}]`)),
    flow: parseOptionalFlow(source.flow, `${where}.flow`),
    extraFlows: readOptionalArray(source, 'extra_flows', where).map((item, index) => parseExtraFlow(item, `${where}.extra_flows[${index}]`)),
    args: readOptionalNumber(source, 'args', where) ?? 0,
  };
}

function parseDetails(value: JsonValue | undefined, where: string): Map<string, Snapshot[]> {
  const details = new Map<string, Snapshot[]>();
  if (value === undefined || value === null) return details;
  for (const [topic, entry] of Object.entries(asObject(value, where))) {
    const entryWhere = `${where}.${topic}`;
    details.set(topic, parseSnapshots(readArray(asObject(entry, entryWhere), 'replies', entryWhere), `${entryWhere}.replies`));
  }
  return details;
}

export function parseRecording(value: JsonValue, where: string): Recording {
  if (value === null) return EMPTY_RECORDING;
  const source = asObject(value, where);
  assertOnlyKeys(source, RECORDING_KEYS, where);
  return {
    ...parseSource(source, where),
    variants: readOptionalArray(source, 'variants', where).map((item, index) => {
      const variantWhere = `${where}.variants[${index}]`;
      const variant = asObject(item, variantWhere);
      assertOnlyKeys(variant, SOURCE_KEYS, variantWhere);
      return parseSource(variant, variantWhere);
    }),
    details: parseDetails(source.details, `${where}.details`),
    samples: readOptionalArray(source, 'samples', where).map((item, index) => {
      if (!Array.isArray(item)) throw new InvalidDataError(`${where}.samples[${index}]`, 'an array');
      return parseSnapshots(item, `${where}.samples[${index}]`);
    }),
    voiceNotice: parseSnapshots(readOptionalArray(source, 'voice_notice', where), `${where}.voice_notice`),
    permissionNotice: parseSnapshots(readOptionalArray(source, 'permission_notice', where), `${where}.permission_notice`),
  };
}

export function flowsOf(recording: Recording): Flow[] {
  const found: Flow[] = [];
  const visit = (flow: Flow | null): void => {
    if (!flow) return;
    found.push(flow);
    for (const transition of flow.transitions) visit(transition.replyFlow);
  };
  for (const source of [recording, ...recording.variants]) {
    visit(source.flow);
    for (const extra of source.extraFlows) visit(extra);
  }
  return found;
}
