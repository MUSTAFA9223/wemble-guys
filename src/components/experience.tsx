import { Environment, OrbitControls } from "@react-three/drei";
import { Character, GameArena } from "@/components";
import { MedievalCafeHDR } from "@/assets";

export const Experience = () => (
  <>
    <OrbitControls target={[0, 1, 0]} />
    <Environment files={MedievalCafeHDR} />
    <Character color="yellow" position={[0, 0, 0]} />
    <GameArena />
  </>
);
