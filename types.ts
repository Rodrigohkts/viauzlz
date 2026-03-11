
export interface ImageState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
}

export enum ProcessingStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
  REFINING = 'REFINING',
  GENERATING_POSE = 'GENERATING_POSE',
  GENERATING_HAIR = 'GENERATING_HAIR',
  GENERATING_SINGER_SWAP = 'GENERATING_SINGER_SWAP',
  GENERATING_FLYER_TEXT = 'GENERATING_FLYER_TEXT',
  GENERATING_SINGER_VAR = 'GENERATING_SINGER_VAR',
  GENERATING_BEAUTY_BG = 'GENERATING_BEAUTY_BG',
  GENERATING_ULTRA_IMG = 'GENERATING_ULTRA_IMG',
  GENERATING_ULTRA_VIDEO = 'GENERATING_ULTRA_VIDEO',
  GENERATING_PROMPT_ENHANCEMENT = 'GENERATING_PROMPT_ENHANCEMENT'
}

export interface GenerationResult {
  imageUrl: string | null;
  error?: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface ControlOption {
  id: string;
  label: string;
  prompt: string;
  icon?: string;
}

export interface Coupon {
  code: string;
  value: number;
  isRedeemed: boolean;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface SavedFlowState {
  version: number;
  timestamp: number;
  credits?: number; 
  positions: {
    person: Position;
    clothing: Position;
    process: Position;
    output: Position;
    editor: Position;
    bgEditor: Position;
    final: Position;
    poseControl: Position;
    poseOutput: Position;
    hairControl: Position;
    hairOutput: Position;
  };
  singerFlow?: {
      positions: {
          flyerRef: Position;
          singerImg: Position;
          processSwap: Position;
          baseResult: Position;
          eventData: Position;
          processText: Position;
          finalOutput: Position;
          singerVariationControl?: Position;
          singerVariationOutput?: Position;
      };
      text: string;
      textConfig?: {
          fontSize: string;
          fontColor: string;
          fontFamily: string;
      };
      images: {
          flyerRef: ImageState;
          singer: ImageState;
          baseResult: string | null;
          finalResult: string | null;
          variationResult?: string | null;
      };
  };
  beautyFlow?: {
      positions: {
          product: Position;
          palette: Position;
          format: Position;
          price: Position;
          process: Position;
          output: Position;
      };
      aspectRatio: string;
      priceValue?: string;
      images: {
          product: ImageState;
          palette: ImageState;
          result: string | null;
      };
  };
  ultraFlow?: {
      positions: {
          refImage: Position;
          prompt: Position;
          config: Position;
          processImg: Position;
          outputImg: Position;
          videoStyle: Position;
          processVideo: Position;
          outputVideo: Position;
      };
      textPrompt: string;
      videoStyleId?: string;
      images: {
          ref: ImageState;
          resultImg: string | null;
          resultVideo: string | null;
      };
  };
  images: {
    person: ImageState;
    clothing: ImageState;
    result: string | null;
    finalResult: string | null;
    poseResult: string | null;
    hairResult: string | null;
  };
  ui: {
    showExtendedFlow: boolean;
  };
}
