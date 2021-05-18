<template>
  <div class="hello">
    <canvas ref="canvas" width="800" height="600"></canvas>
    <div>
      <span style="padding: 10px"> x: {{ x }} y: {{ y }} z: {{ z }} </span>
      <label style="padding: 10px" for="text">Text</label>
      <input id="text" type="text" v-model="displayText" />
      <button v-on:click="outputToJson()">Output</button>
    </div>
    <textarea v-bind:value="outputJson"></textarea>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import * as THREE from "three";
import { DysonNode, DysonShell, DysonSphere } from "../DysonSphereModel";
import earth from "@/assets/earthmap1k.jpg";
import earthBump from "@/assets/earthbump1k.jpg";
import earthSpecular from "@/assets/earth-specular.png";
import { OrbitControls } from "../OrbitControls";
import { RescaleLayer, MeshToLayer } from "../utils/DysonSphereUtils";

function geometryForShell(
  shell: DysonShell,
  nodeMap: Map<number, DysonNode>,
  scene: THREE.Scene
) {
  let geometry = new THREE.BufferGeometry();
  let nodes = shell.nodeIds.map((id) => nodeMap.get(id));

  let pts = nodes.map((n) => new THREE.Vector3(n!.pos.x, n!.pos.y, n!.pos.z));
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
  dysonSphere.layers.forEach((layer) => {
    let idMap = new Map<number, DysonNode>();
    layer.nodes.forEach((node) => {
      idMap.set(node.id, node);
    });
    console.log(`Nodes: ${layer.nodes.length}`);
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff,
    });
    layer.shells?.forEach((shell) => {
      let nodes: DysonNode[] = shell.nodeIds?.map((idx) =>
        idMap.get(idx)
      ) as DysonNode[];
      const points = nodes.map(
        (n) => new THREE.Vector3(n.pos.x, n.pos.y, n.pos.z)
      );
      const geometry = new THREE.BufferGeometry();
      geometry.setFromPoints(points);
      const line = new THREE.Line(geometry, material);
      line.type = "LineLoop";
      scene.add(line);
      geometryForShell(shell, idMap, scene);
    });
  });
  let loader = new THREE.TextureLoader();
  let texture = loader.load(earth);
  let bumpMap = loader.load(earthBump);
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(dysonSphere.minOrbitRadius * 0.7, 32, 32),
    new THREE.MeshPhongMaterial({
      map: texture,
      bumpMap: bumpMap,
      bumpScale: 0.5,
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
  name: "DysonSphere",
  data: function () {
    return {
      cameraPosition: new THREE.Vector3(),
      font: {} as THREE.Font,
      loader: new THREE.FontLoader(),
      dysonSphere: {} as DysonSphere,
      displayText: "",
      displayTextMesh: {} as THREE.Mesh,
      scene: {} as THREE.Scene,
      outputJson: "",
    };
  },
  props: {
    dyson: String,
  },
  methods: {
    outputToJson() {
      this.outputJson = JSON.stringify(MeshToLayer(this.displayTextMesh));
    },
    geometryForText(text: string) {
      const textDistance = this.maxLayerRadius + 1000;
      console.log(this.maxLayerRadius);

      let geometry = new THREE.TextGeometry(text, {
        font: this.font,
        size: textDistance / 3,
        height: 0.02,
      });
      return geometry;
    },
    addText: function (text: string, scene: THREE.Scene) {
      const textDistance = this.maxLayerRadius + 1000;
      let geometry = this.geometryForText(text);
      let mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({ color: "pink" })
      );
      mesh.position.x = -textDistance * 0.5;
      mesh.position.z = textDistance;
      scene.add(mesh);
      this.displayTextMesh = mesh;
    },
  },
  mounted: async function () {
    const canvas: HTMLCanvasElement = this.$refs["canvas"] as HTMLCanvasElement;
    console.log(canvas);
    const JetbrainMono = await import("@/assets/JetBrains_Mono_NL_Regular");
    this.font = this.loader.parse(JetbrainMono);
    const znear = 0.1;
    const zfar = 200000;
    const camera = new THREE.PerspectiveCamera(
      75,
      canvas.width / canvas.height,
      znear,
      zfar
    );

    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setClearColor(new THREE.Color(0xaaaaaa));

    renderer.setSize(canvas.width, canvas.height);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.zoomSpeed = 0.5;
    controls.minDistance = znear * 2;
    controls.maxDistance = zfar;
    ((controls as any) as THREE.EventDispatcher).addEventListener(
      "change",
      (o) => {
        this.$data.cameraPosition.x = camera.position.x;
        this.$data.cameraPosition.y = camera.position.y;
        this.$data.cameraPosition.z = camera.position.z;
      }
    );
    const scene = new THREE.Scene();
    this.scene = scene;

    this.dysonSphere = await import("@/assets/large_sphere.json");
    this.dysonSphere.layers.forEach((l) =>
      RescaleLayer(l, this.dysonSphere.minOrbitRadius)
    );

    loadSphere(scene, this.dysonSphere);
    this.addText("Eve", scene);

    camera.position.set(0, 0, this.dysonSphere.maxOrbitRadius);
    camera.lookAt(0, 0, 0);

    const render = (time: number) => {
      if (resizeRendererToDisplaySize(renderer)) {
        const canvas = renderer.domElement;
        camera.aspect = canvas.clientWidth / canvas.clientHeight;
        camera.updateProjectionMatrix();
      }

      renderer.render(scene, camera);
      controls.update();

      requestAnimationFrame(render);
    };

    requestAnimationFrame(render);
  },
  computed: {
    maxLayerRadius(): number {
      return Math.max(...this.dysonSphere.layers.map((l) => l.orbitRadius));
    },
    x(): string {
      return this.cameraPosition.x.toFixed(4);
    },
    y(): string {
      return this.cameraPosition.y.toFixed(4);
    },
    z(): string {
      return this.cameraPosition.z.toFixed(4);
    },
  },
  watch: {
    displayText: function (newText, oldTextt) {
      console.log({ newText });
      const geometry = this.geometryForText(newText);
      this.displayTextMesh.geometry.dispose();
      this.displayTextMesh.geometry = geometry;
      geometry.computeBoundingBox();
      const boundingBox = geometry.boundingBox!;
      const textWidth = boundingBox.max.x - boundingBox.min.x;
      this.displayTextMesh.position.x = -textWidth * 0.5;
    },
  },
});
</script>

<style scoped></style>
