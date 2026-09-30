import type { ActivitySegment, SlotId } from '@thesis/ai-classifier'

export interface Sample {
    timestamp: number;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    mx?: number;
    my?: number;
    mz?: number;
    pressure?: number;
    temperature?: number;
    roll?: number;
    pitch?: number;
    yaw?: number;
    lat?: number;
    lon?: number;
    fix?: number;
    alt?: number;
    sat?: number;
  }
  
  export interface ManeuverEvent {
    timestamp: number;
    type: string;
    score: number;
  }
  
  export interface DetectParams {
    rate?: number;
    accThr?: number;
    gyrThr?: number;
    minSep?: number; // segundos
  }

  export interface Session {
    id: string;
    samples: Sample[];
    results: ClassifierResult[];
    intervalMs: number;
    manuevers: ManeuverEvent[];
    predictions: ClassifierResult[];
    activities: ActivitySegment[];
    classifierSlot: SlotId;
  }

  export interface ClassifierResult {
    label: string;
    value: number;
  };
  