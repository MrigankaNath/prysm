import { Suspense, useMemo } from "react";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const CAMERA_DISTANCE = 4;
const CAMERA_FOV = 45;
const FIT_MARGIN = 1.18;

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

        // Grazing angles bloom brightest, so the edge fades out softly instead
        // of ending on a hard silhouette.
        float facing = abs(dot(normalize(vNormalW), normalize(vToCam)));
        float bloom = 0.28 + 0.85 * pow(1.0 - facing, 1.7);

        // Bright inner filament down the centre of the bloom.
        float filament = pow(1.0 - facing, 5.0) * 0.7;

        // A comet of light travelling the length of the edge.
        float comet = smoothstep(0.86, 1.0, fract(along * 0.5 - uTime * 0.22)) * 0.6;

        vec3 colour = hue * bloom + vec3(filament + comet);
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

function PrismScene() {
  const { scene } = useGLTF("/models/hero-model.glb");
  const { size } = useThree();
  const glowMaterial = useMemo(makeEdgeGlowMaterial, []);

  useMemo(() => {
    let patched = 0;
    scene.traverse((object) => {
      if (object.isMesh && isUnmaterialised(object)) {
        object.material = glowMaterial;
        object.renderOrder = 2;
        patched += 1;
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

      <ContactShadows
        position={[0, bottomY - Math.abs(bottomY) * 0.18, 0]}
        scale={Math.abs(bottomY) * 4.5 || 3}
        opacity={0.5}
        blur={2.6}
        far={Math.abs(bottomY) * 2.5 || 2}
        resolution={1024}
        color="#000000"
      />
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
