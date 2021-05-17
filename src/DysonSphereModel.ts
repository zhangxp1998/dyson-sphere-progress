export interface DysonSphere {
  layers: DysonLayer[];
  minOrbitRadius: number;
  maxOrbitRadius: number;
  dysonLumino: number;
}

export interface DysonLayer {
  orbitRadius: number;
  orbitRotation: OrbitRotation;
  orbitAngularSpeed: number;
  gridMode: number;
  id: number;
  nodes: DysonNode[];
  frames: DysonFrame[];
  shells: DysonShell[];
}

export interface OrbitRotation {
  x: number;
  y: number;
  z: number;
  w: number;
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

export interface DysonFrame {
  nodeAId: number;
  nodeBId: number;
  euler: boolean;
  id: number;
  protoId: number;
}

export interface DysonShell {
  id: number;
  protoId: number;
  nodeIds: number[];
}
