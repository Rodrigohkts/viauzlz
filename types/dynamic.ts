export type PortType = 'text' | 'image' | 'video' | 'any';

export interface DynamicNode {
  id: string;
  type: 'prompt' | 'image_input' | 'image_gen' | 'video_gen';
  position: { x: number; y: number };
  data: any;
  width?: number;
  height?: number;
}

export interface DynamicConnection {
  id: string;
  sourceNode: string;
  sourcePort: string;
  targetNode: string;
  targetPort: string;
}

export interface PortDef {
  id: string;
  type: PortType;
  label?: string;
  icon?: any; // Lucide icon
}

export interface NodeDef {
  type: string;
  title: string;
  inputs: PortDef[];
  outputs: PortDef[];
  defaultData: any;
}
