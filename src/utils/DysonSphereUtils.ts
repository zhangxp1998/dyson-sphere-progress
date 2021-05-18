import { Mesh, Vector3 } from "three";
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

function binarySearch<T>(arr: T[], target: T, compare: (a: T, b: T) => number) {
  let begin = 0;
  let end = arr.length - 1;
  while (begin <= end) {
    const mid = Math.floor((begin + end) / 2);
    const cmp = compare(target, arr[mid]);
    if (cmp == 0) {
      return mid;
    }
    if (cmp < 0) {
      end = mid - 1;
    } else {
      begin = mid + 1;
    }
  }
  return -1;
}

function pointCompare(a: Vector3, b: Vector3) {
  if (a.x != b.x) return a.x - b.x;
  if (a.y != b.y) return a.y - b.y;
  return a.z - b.z;
}

function dedup(points: Vector3[]) {
  points.sort(pointCompare);
  const output = [points[0]];
  for (let i = 1; i < points.length; i++) {
    if (!points[i].equals(points[i - 1])) {
      output.push(points[i]);
    }
  }
  return output;
}

function ToLayer(
  uniquePoints: Vector3[],
  uniqueFrames: Array<number[]>,
  shells: Array<number[]>
) {
  const layer = {} as DysonLayer;
  layer.gridMode = 2;
  layer.nodes = uniquePoints.map((p, idx) => {
    return { pos: { ...p }, id: idx + 1, protoId: 0 };
  });
  layer.frames = uniqueFrames.map((fr, idx) => {
    return {
      nodeAId: fr[0],
      nodeBId: fr[1],
      euler: false,
      id: idx + 1,
      protoId: 1,
    };
  });
  layer.shells = shells.map((shell, idx) => {
    return {
      id: idx + 1,
      protoId: 0,
      nodeIds: shell,
    };
  });
  return layer;
}

export function MeshToLayer(mesh: Mesh) {
  let geometry = mesh.geometry;
  if (geometry.index !== null) {
    geometry = geometry.toNonIndexed();
  }
  const position = geometry.getAttribute("position");
  if (position.itemSize != 3) {
    throw `Unexpected item size when exporting: ${position.itemSize}`;
  }
  const meshPoints: Vector3[] = new Array(
    position.array.length / position.itemSize
  );
  mesh.updateMatrixWorld();
  const matrixWorld = mesh.matrixWorld;
  for (let i = 0; i < meshPoints.length; i++) {
    meshPoints[i] = new Vector3(
      position.array[i * 3],
      position.array[i * 3 + 1],
      position.array[i * 3 + 2]
    ).applyMatrix4(matrixWorld);
  }

  const points = dedup(meshPoints);
  const dysonLayer = {} as DysonLayer;
  dysonLayer.nodes = [];
  points.forEach((p, idx) => {
    dysonLayer.nodes.push({ protoId: 0, pos: { ...p }, id: idx + 1 });
  });
  const uniqueFrames = new Array<number[]>();
  const meshTriangles = new Array<number[]>();
  for (let i = 0; i < meshPoints.length; i += 3) {
    const a = binarySearch(points, meshPoints[i], pointCompare) + 1;
    const b = binarySearch(points, meshPoints[i + 1], pointCompare) + 1;
    const c = binarySearch(points, meshPoints[i + 2], pointCompare) + 1;
    const frames = [
      [a, b],
      [a, c],
      [b, c],
    ];
    frames.forEach((fr) => {
      if (fr[0] < fr[1]) {
        uniqueFrames.push(fr);
      }
    });
    meshTriangles.push([a, b, c]);
  }
  console.log(
    `${uniqueFrames.length} unique frames, ${meshPoints.length} points, ${points.length} unique points`
  );
  return ToLayer(points, uniqueFrames, meshTriangles);
}
