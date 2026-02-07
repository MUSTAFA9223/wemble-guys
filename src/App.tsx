import { Canvas } from "@react-three/fiber";
import { AudioManagerProvider } from "./hooks";
import { Experience, UI } from "@/components";
import { Loader } from "@react-three/drei";

const App = () => {
  return (
    <AudioManagerProvider>
      <Loader />
      <Canvas shadows camera={{ position: [0, 16, 10], fov: 42 }}>
        <color attach="background" args={["#041c0b"]} />
        <Experience />
      </Canvas>
      <UI />
    </AudioManagerProvider>
  );
};

export default App;
