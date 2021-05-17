import { DysonLayer } from "../DysonSphereModel";

export function RescaleLayer(layer: DysonLayer, radius: number) {
  const ratio = radius / layer.orbitRadius;
  layer.nodes.map((n) => {
    n.pos.x *= ratio;
    n.pos.y *= ratio;
    n.pos.z *= ratio;
  });
  layer.orbitRadius = radius;
}
