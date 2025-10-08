
export interface Sample {
    timestamp: number;
    ax: number;
    ay: number;
    az: number;
    gx: number;
    gy: number;
    gz: number;
    lat?: number;
    lon?: number;
    fix?: number;
    alt?: number;
    sat?: number;
  }
  
  export interface ManeuverEvent {
    timestamp: number;
    type: 'impacto' | 'rotacao' | 'manobra_composta';
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
  }
  