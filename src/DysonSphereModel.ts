export interface DysonSphere {
  layers: Layers;
  minOrbitRadius: number;
  maxOrbitRadius: number;
  dysonLumino: number;
}

export interface Layers {
  $content?: Layer[] | null;
  $type: string;
}

export interface Layer {
  orbitRadius: number;
  orbitRotation: OrbitRotation;
  orbitAngularSpeed: number;
  gridMode: number;
  id: number;
  nodes: Nodes;
  frames: Frames;
  shells: Shells;
}

export interface OrbitRotation {
  x: number;
  y: number;
  z: number;
  w: number;
}

export interface Nodes {
  $content?: DysonNode[] | null;
  $type: string;
}

export interface DysonNode {
  pos: Pos;
  id: number;
  protoId: number;
}

export interface Pos {
  x: number;
  y: number;
  z: number;
}

export interface Frames {
  $content?: DysonFrame[] | null;
  $type: string;
}

export interface DysonFrame {
  nodeAId: number;
  nodeBId: number;
  euler: boolean;
  id: number;
  protoId: number;
}

export interface Shells {
  $content?: DysonShell[] | null;
  $type: string;
}

export interface DysonShell {
  id: number;
  protoId: number;
  nodeIds: NodeIds;
}

export interface NodeIds {
  $content?: number[] | null;
  $type: string;
}
