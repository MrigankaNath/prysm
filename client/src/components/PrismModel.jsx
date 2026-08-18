import { Suspense, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import * as THREE from "three";

const CAMERA_DISTANCE = 4;
const CAMERA_FOV = 45;
// The prism is the main event on the page, so this stays tight. The soft halo
// extends a little past the rods, so leave it some room to fall off rather than
// clipping against the frame.
const FIT_MARGIN = 1.1;

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

const GLOW_VERTEX_SHADER = `
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
`;

const SPECTRUM_GLSL = `
  vec3 spectrum(float h) {
    vec3 k = mod(vec3(5.0, 3.0, 1.0) + h * 6.0, 6.0);
    return clamp(min(k, 4.0 - k), 0.0, 1.0);
  }
  float along(vec3 p) {
    return p.y * 0.42 + p.x * 0.26 + p.z * 0.18;
  }
`;

// The inner shell, rendered as the lit body of a neon tube: fully opaque, so
// nothing behind it shows through, and brightest where the surface faces the
// camera (the middle of the rod) fading to saturated colour at the silhouette.
// A fresnel/rim falloff would do the opposite — bright edges, hollow centre —
// which is what made these read as transparent shells rather than solid rods.
function makeEdgeCoreMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: GLOW_VERTEX_SHADER,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vLocal;
      varying vec3 vNormalW;
      varying vec3 vToCam;
      ${SPECTRUM_GLSL}

      void main() {
        float a = along(vLocal);
        vec3 hue = spectrum(fract(a + uTime * 0.05));

        float facing = abs(dot(normalize(vNormalW), normalize(vToCam)));

        // White-hot down the centreline, pure colour toward the silhouette.
        vec3 colour = mix(hue * 1.15, vec3(1.0), pow(facing, 1.5) * 0.85);

        // The travelling comet blows the core out to white as it passes.
        float sweep = smoothstep(0.88, 1.0, fract(a * 0.5 - uTime * 0.22));
        colour += vec3(sweep) * 0.9;

        gl_FragColor = vec4(colour, 1.0);
      }
    `,
    toneMapped: false,
    depthWrite: true,
  });
}

// The outer shell is only spill: additive and strongest at grazing angles, so it
// haloes the solid core instead of drawing a second visible surface.
function makeEdgeHaloMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: GLOW_VERTEX_SHADER,
    fragmentShader: `
      uniform float uTime;
      varying vec3 vLocal;
      varying vec3 vNormalW;
      varying vec3 vToCam;
      ${SPECTRUM_GLSL}

      void main() {
        float a = along(vLocal);
        vec3 hue = spectrum(fract(a + uTime * 0.05));

        float facing = abs(dot(normalize(vNormalW), normalize(vToCam)));
        float rim = 1.0 - facing;

        // pow() piles the light into a hard bright ring right at the silhouette,
        // which reads as a crisp outline rather than glow. smoothstep spreads it
        // across the whole shell with soft shoulders, so it behaves like light
        // falling off through air — depth around the rod, no visible edge.
        float soft = smoothstep(0.0, 0.9, rim);
        float halo = mix(0.05, 0.32, soft);

        float sweep = smoothstep(0.88, 1.0, fract(a * 0.5 - uTime * 0.22));
        halo += sweep * soft * 0.3;

        gl_FragColor = vec4(hue * halo, 1.0);
      }
    `,
    transparent: true,
    // Additive so overlapping haloes sum at the corners instead of clipping.
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
  const coreMaterial = useMemo(makeEdgeCoreMaterial, []);
  const haloMaterial = useMemo(makeEdgeHaloMaterial, []);
  const lightPool = useMemo(makeLightPoolTexture, []);

  useMemo(() => {
    const glowShells = [];

    scene.traverse((object) => {
      if (!object.isMesh) return;

      // The 16 unmaterialised meshes are the glow shells — two per edge.
      if (isUnmaterialised(object)) {
        glowShells.push(object);
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

    if (glowShells.length === 0) {
      console.warn("prism: no unmaterialised edge meshes found to light up");
      return;
    }

    // Shells come in pairs per edge — a wide bloom and a thin filament (cross
    // sections measure ~0.11 and ~0.036 in the model). Pair them up and let the
    // thinner one be the solid neon core, the wider one its halo.
    const withRadius = glowShells.map((mesh) => {
      mesh.geometry.computeBoundingBox();
      const extent = new THREE.Vector3();
      mesh.geometry.boundingBox.getSize(extent);
      // Ignore the long axis; the two short ones describe the rod's thickness.
      const [thin, mid] = [extent.x, extent.y, extent.z].sort((a, b) => a - b);
      return { mesh, thickness: thin * mid };
    });

    for (let i = 0; i < withRadius.length; i += 2) {
      const pair = [withRadius[i], withRadius[i + 1]].filter(Boolean);
      pair.sort((a, b) => a.thickness - b.thickness);

      const [core, halo] = pair;
      core.mesh.material = coreMaterial;
      core.mesh.renderOrder = 3;

      if (halo) {
        halo.mesh.material = haloMaterial;
        halo.mesh.renderOrder = 2;
      }
    }

    // The rods are authored to terminate exactly at the pyramid's vertices, so
    // they're left at their true length — stretching them to close the joint
    // just pushes the tips out past the corner. The corner is instead closed in
    // the shader, by keeping each rod lit right to its end cap.
    glowShells.forEach((mesh) => {
      // Per-mesh frustum culling pops individual rods out of view when their
      // own bounds cross the frame edge during rotation — that's the "part
      // vanishes when I twist it" behaviour.
      mesh.frustumCulled = false;
    });
  }, [scene, coreMaterial, haloMaterial]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    coreMaterial.uniforms.uTime.value = t;
    haloMaterial.uniforms.uTime.value = t;
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
