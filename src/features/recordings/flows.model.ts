import { EMPTY_RECORDING, flowsOf, type Flow, type Recording } from './recording.model';

const flowsById = new Map<string, Flow>();
const recordedCustomIds = new Set<string>();
let mentionRecording: Recording = EMPTY_RECORDING;

export function indexRecording(recording: Recording): void {
  for (const flow of flowsOf(recording)) {
    flowsById.set(flow.id, flow);
    for (const transition of flow.transitions) recordedCustomIds.add(transition.customId);
  }
}

export function setMentionRecording(recording: Recording): void {
  mentionRecording = recording;
  indexRecording(recording);
}

export function clearFlowIndex(): void {
  flowsById.clear();
  recordedCustomIds.clear();
  mentionRecording = EMPTY_RECORDING;
}

export const flowById = (id: string): Flow | null => flowsById.get(id) ?? null;
export const allFlows = (): Flow[] => [...flowsById.values()];
export const isRecordedCustomId = (customId: string): boolean => recordedCustomIds.has(customId);
export const mention = (): Recording => mentionRecording;
