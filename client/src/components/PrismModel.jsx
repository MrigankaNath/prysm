import { Suspense, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, useGLTF, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

const CAMERA_DISTANCE = 4;
const CAMERA_FOV = 45;
const FIT_MARGIN = 1.18;

function PrismScene() {
  const { scene } = useGLTF("/models/hero-model.glb");
  const { size } = useThree();

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
