import { Suspense, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const CAMERA_DISTANCE = 4;
const CAMERA_FOV = 45;
// Tight: the prism is the main event on the page. The glow now falls off softly
// at its extremities, so it can sit much closer to the frame than when the hard
// edge geometry was still visible.
const FIT_MARGIN = 1.04;

// The GLB's 16 edge meshes ship with no material, so glTF falls back to the
// default opaque grey — that grey is the "unfinished" look. Matching on the node
// name missed almost all of them (glTF node names repeat and the loader doesn't
// preserve them per-instance), so key off the defect itself: every real material
// in this file is named, and only the fallback is nameless.
function isUnmaterialised(mesh) {
  const material = mesh.material;
  if (!material || Array.isArray(material)) return false;
  return !material.name;
}

// Purely emissive: no lighting term at all, so the geometry itself is never
// visible — only the light it emits. Hue is driven by object-space position
// rather than UVs (the edges' UV layout is unknown), so the spectrum drifts
// along each edge and wraps continuously around the corners.
function makeEdgeGlowMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: `
      varying vec3 vLocal;
      varying vec3 vNormalW;
      varying vec3 vToCam;

      void main() {
        vLocal = position;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vNormalW = normalize(mat3(modelMatrix) * normal);
        vToCam = normalize(cameraPosition - worldPos.xyz);
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vLocal;
      varying vec3 vNormalW;
      varying vec3 vToCam;

      vec3 spectrum(float h) {
        vec3 k = mod(vec3(5.0, 3.0, 1.0) + h * 6.0, 6.0);
        return clamp(min(k, 4.0 - k), 0.0, 1.0);
      }

      void main() {
        float along = vLocal.y * 0.42 + vLocal.x * 0.26 + vLocal.z * 0.18;

        vec3 hue = spectrum(fract(along + uTime * 0.05));

        float facing = abs(dot(normalize(vNormalW), normalize(vToCam)));
        float rim = 1.0 - facing;

        // Apparent thickness lives in this falloff, not the geometry. The flat
        // term lights the whole shell evenly and is what made the edge read as a
        // fat tube, so it's kept minimal and the exponent steep — the light
        // collapses into a thin filament along the true edge.
        float bloom = 0.03 + 0.40 * pow(rim, 3.4);

        // Crisp core running down the centre of that thin band.
        float filament = pow(rim, 8.0) * 0.32;

        // The travelling comet, brighter now that it has a skinnier edge to run
        // along, and biased to the visible band so it reads as a streak.
        float sweep = smoothstep(0.90, 1.0, fract(along * 0.5 - uTime * 0.22));
        float comet = sweep * (0.25 + 0.75 * pow(rim, 2.0)) * 0.95;

        vec3 colour = hue * bloom + vec3(filament) + hue * comet * 0.6 + vec3(comet * 0.5);
        gl_FragColor = vec4(colour, 1.0);
      }
    `,
    transparent: true,
    // Additive means overlapping glows sum into a brighter joint at the corners
    // rather than one clipping the next.
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

// A contact shadow is darkness, and the page is already pure black — there is
// nothing for it to darken, so it never showed. What actually grounds an object
// on black is the opposite: light pooling on the surface beneath it.
function makeLightPoolTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const glow = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  glow.addColorStop(0, "rgba(255,255,255,0.30)");
  glow.addColorStop(0.35, "rgba(190,180,255,0.13)");
  glow.addColorStop(1, "rgba(0,0,0,0)");

  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function PrismScene() {
  const { scene } = useGLTF("/models/hero-model.glb");
  const { size } = useThree();
  const glowMaterial = useMemo(makeEdgeGlowMaterial, []);
  const lightPool = useMemo(makeLightPoolTexture, []);

  useMemo(() => {
    let patched = 0;

    scene.traverse((object) => {
      if (!object.isMesh) return;

      // The 16 unmaterialised meshes are the glow shells.
      if (isUnmaterialised(object)) {
        object.material = glowMaterial;
        object.renderOrder = 2;
        patched += 1;
        return;
      }

      const material = object.material;
      if (!material || Array.isArray(material)) return;

      // `prism_edges` is solid geometry running down the middle of each glow —
      // the skeleton showing through. The glow shells already describe the
      // edges, so this only ever reads as a hard core inside soft light.
      if (material.name === "prism_edges") {
        object.visible = false;
        return;
      }

      // The tiles carry no emissive, so sitting behind tinted glass they render
      // almost black. Let them emit a fraction of their own colour so they read
      // clearly without competing with the edges.
      if (material.name.startsWith("tile_")) {
        material.emissive = new THREE.Color(material.color);
        material.emissiveIntensity = 0.85;
        material.toneMapped = false;
      }
    });

    if (patched === 0) {
      console.warn("prism: no unmaterialised edge meshes found to light up");
    }
  }, [scene, glowMaterial]);

  useFrame((state) => {
    glowMaterial.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const { scale, offset, bottomY } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const center = new THREE.Vector3();
    const extent = new THREE.Vector3();
    box.getCenter(center);
    box.getSize(extent);

    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);

    // Visible half-extents at the camera's fixed distance.
    const halfHeight = CAMERA_DISTANCE * Math.tan((CAMERA_FOV * Math.PI) / 360);
    const halfWidth = halfHeight * (size.width / size.height);
    const allowedRadius = Math.min(halfHeight, halfWidth) / FIT_MARGIN;

    const fitScale = allowedRadius / (sphere.radius || 1);

    return {
      scale: fitScale,
      offset: center.clone().multiplyScalar(-fitScale),
      bottomY: (-extent.y / 2) * fitScale,
    };
  }, [scene, size.width, size.height]);

  return (
    <>
      <group scale={scale} position={offset}>
        <primitive object={scene} />
      </group>

      <mesh
        position={[0, bottomY - Math.abs(bottomY) * 0.06, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={1}
      >
        <planeGeometry args={[Math.abs(bottomY) * 5 || 3.4, Math.abs(bottomY) * 5 || 3.4]} />
        <meshBasicMaterial
          map={lightPool}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </>
  );
}

function PrismModel() {
  return (
    <Canvas
      className="prism-model-canvas"
      gl={{ alpha: true }}
      camera={{ position: [0, 0, CAMERA_DISTANCE], fov: CAMERA_FOV }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={2} />
      <directionalLight position={[-5, -2, -5]} intensity={0.5} />
      <Suspense fallback={null}>
        <PrismScene />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={1.5} enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

export default PrismModel;
