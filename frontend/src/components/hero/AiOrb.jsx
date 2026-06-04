import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function Orb() {
  const mesh = useRef(null);
  const ring = useRef(null);
  useFrame((_, delta) => {
    if (mesh.current) mesh.current.rotation.y += delta * 0.35;
    if (ring.current) ring.current.rotation.z += delta * 0.5;
  });
  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.6, 3]} />
        <meshStandardMaterial color="#6366F1" roughness={0.25} metalness={0.55} emissive="#312E81" emissiveIntensity={0.45} />
      </mesh>
      <mesh ref={ring} rotation={[1.2, 0.25, 0]}>
        <torusGeometry args={[2.2, 0.018, 16, 120]} />
        <meshStandardMaterial color="#67E8F9" emissive="#0891B2" emissiveIntensity={0.7} />
      </mesh>
      <mesh rotation={[0.3, 1.1, 0]}>
        <torusGeometry args={[2.45, 0.014, 16, 120]} />
        <meshStandardMaterial color="#A5B4FC" emissive="#6366F1" emissiveIntensity={0.55} />
      </mesh>
    </group>
  );
}

export default function AiOrb() {
  return (
    <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <pointLight position={[4, 5, 5]} intensity={2.4} color="#818CF8" />
      <pointLight position={[-4, -3, 2]} intensity={1.2} color="#22D3EE" />
      <Orb />
    </Canvas>
  );
}
