import { SCALES, parseNote, tonicName, type ScaleId } from './theory';

export type LabelMode = 'degrees' | 'notes';

export interface ExplorerState {
  tonicPc: number;
  scale: ScaleId;
  labels: LabelMode;
}

export const DEFAULT_STATE: ExplorerState = { tonicPc: 0, scale: 'major', labels: 'degrees' };

export function parseState(search: string): ExplorerState {
  const params = new URLSearchParams(search);
  const scale = SCALES.find((s) => s.id === params.get('scale'))?.id ?? DEFAULT_STATE.scale;
  const labels = params.get('labels') === 'notes' ? 'notes' : DEFAULT_STATE.labels;
  const tonicPc = parseNote(params.get('key') ?? '') ?? DEFAULT_STATE.tonicPc;
  return { tonicPc, scale, labels };
}

export function serializeState(state: ExplorerState): string {
  const params = new URLSearchParams({ key: tonicName(state.tonicPc, state.scale), scale: state.scale });
  if (state.labels !== DEFAULT_STATE.labels) params.set('labels', state.labels);
  return `?${params}`;
}
