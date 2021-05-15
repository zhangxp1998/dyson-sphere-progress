<template>
  <div class="hello">
    <canvas ref="canvas" width="800" height="600"></canvas>
    <p>x: {{ cameraPosition.x }}</p>
    <p>y: {{ cameraPosition.y }}</p>
    <p>z: {{ cameraPosition.z }}</p>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as THREE from "three";
import { DysonNode, DysonShell, DysonSphere } from "../DysonSphereModel";
import dysonSphere from "../large_sphere";
import earth from "@/assets/earthmap1k.jpg";
import earthBump from "@/assets/earthbump1k.jpg";
import earthSpecular from "@/assets/earth-specular.png";

import OrbitControls from "../OrbitControls";

function geometryForShell(
  shell: DysonShell,
  nodeMap: Map<number, DysonNode>,
  sphereRadius: number,
  scene: THREE.Scene
) {
  let geometry = new THREE.BufferGeometry();
  let nodes = shell.nodeIds.$content!.map((id) => nodeMap.get(id));

  let pts = nodes.map((n) =>
    new THREE.Vector3(n!.pos.x, n!.pos.y, n!.pos.z).divideScalar(sphereRadius)
  );
  let triangles = [];
  let origin = pts[0];
  for (let i = 2; i < pts.length; i++) {
    triangles.push(origin);
    triangles.push(pts[i - 1]);
    triangles.push(pts[i]);
  }

  geometry.setFromPoints(triangles);
  geometry.computeVertexNormals();
  THREE.Triangle;
  scene.add(
    new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        color: "orange",
        side: THREE.DoubleSide,
        emissive: "orange",
        emissiveIntensity: 0.1,
      })
    )
  );
}

function loadSphere(scene: THREE.Scene, dysonSphere: DysonSphere) {
  const sphereRadius = dysonSphere.maxOrbitRadius;
  dysonSphere.layers.$content?.forEach((layer) => {
    let idMap = new Map<number, DysonNode>();
    layer.nodes.$content?.forEach((node) => {
      idMap.set(node.id, node);
    });
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    layer.shells?.$content?.forEach((shell) => {
      let nodes: DysonNode[] = shell.nodeIds?.$content?.map((idx) =>
        idMap.get(idx)
      ) as DysonNode[];
      const points = nodes.map((n) =>
        new THREE.Vector3(n.pos.x, n.pos.y, n.pos.z).divideScalar(sphereRadius)
      );
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.type = "LineLoop";
      scene.add(line);
      geometryForShell(shell, idMap, sphereRadius, scene);
    });
    console.log(layer.shells.$content?.length);
  });
  let loader = new THREE.TextureLoader();
  let texture = loader.load(earth);
  let bumpMap = loader.load(earthBump);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(
      (dysonSphere.minOrbitRadius * 0.7) / sphereRadius,
      32,
      32
    ),
    new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.05,
      specularMap: loader.load(earthSpecular),
      specular: new THREE.Color("grey"),
      side: THREE.DoubleSide,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 0.1,
    })
  );
  scene.add(mesh);
  let light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 1, 1).normalize();
  scene.add(new THREE.PointLight(0xffffff));
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, 0.3));
}

function resizeRendererToDisplaySize(renderer: THREE.Renderer) {
  const canvas = renderer.domElement;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const needResize = canvas.width !== width || canvas.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

export default defineComponent({
  name: "HelloWorld",
  data: function () {
    return { cameraPosition: new THREE.Vector3() };
  },
  mounted: function () {
    const canvas: HTMLCanvasElement = this.$refs["canvas"] as HTMLCanvasElement;
    console.log(canvas);
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      0.1,
      2000
    );
    camera.position.set(0, 0, 1);
    camera.lookAt(0, 0, 0);
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setClearColor(new THREE.Color(0xaaaaaa));

    renderer.setSize(canvas.width, canvas.height);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.zoomSpeed = 0.5;
    controls.minDistance = 0.2;
    const scene = new THREE.Scene();

    loadSphere(scene, dysonSphere);

    const render = (time: number) => {
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
      controls.update();

      requestAnimationFrame(render);
      this.$data.cameraPosition.x = camera.position.x;
      this.$data.cameraPosition.y = camera.position.y;
      this.$data.cameraPosition.z = camera.position.z;
    };

    requestAnimationFrame(render);
  },
});
</script>

<style scoped></style>
