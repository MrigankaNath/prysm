import { Suspense, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const CAMERA_DISTANCE = 4;
const CAMERA_FOV = 45;
const FIT_MARGIN = 1.18;

// The exported GLB leaves the 16 `edge_glow` meshes with no material, so glTF
// falls back to the default opaque grey — which is why the edges read as blunt,
// colourless stubs that don't meet at the corners. Rebuild the intended look
// here: a spectral ramp sampled along each edge's existing UVs, blended
// additively so overlapping glows sum into a smooth joint instead of one
// occluding the next.
function makeSpectrumTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 1;

  const ctx = canvas.getContext("2d");
  const ramp = ctx.createLinearGradient(0, 0, canvas.width, 0);
  const stops = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6"];
  stops.forEach((color, i) => ramp.addColorStop(i / (stops.length - 1), color));

  ctx.fillStyle = ramp;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function PrismScene() {
  const { scene } = useGLTF("/models/hero-model.glb");
  const { size } = useThree();

  useMemo(() => {
    const spectrum = makeSpectrumTexture();

    scene.traverse((object) => {
      if (!object.isMesh || object.name !== "edge_glow") return;

      object.material = new THREE.MeshBasicMaterial({
        map: spectrum,
        transparent: true,
        blending: THREE.AdditiveBlending,
        // Without this each glow writes depth and clips the next one at the
        // corners; that hard cut is the "incomplete" look.
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
        opacity: 0.85,
      });
      // Draw after the glass so the bloom sits on top rather than behind it.
      object.renderOrder = 2;
    });
  }, [scene]);

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
