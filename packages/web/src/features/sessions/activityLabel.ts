const NAMES: Record<string, string> = {
  idle: 'Idle',
  paddling: 'Paddling',
  dropping: 'Dropping',
  riding: 'Riding',
  impacto: 'Impact',
  rotacao: 'Cutback',
  manobra_composta: 'Compound',
  Idle: 'Idle',
  Pop: 'Pop',
  Riding: 'Riding',
}

export function activityName(label: string | null | undefined) {
  if (!label) return 'Idle'
  return NAMES[label] ?? label
}

export const CLEAR_ACTIVITIES = new Set([
  'paddling',
  'dropping',
  'impacto',
  'rotacao',
  'manobra_composta',
])
