import { Canvas } from "@react-three/fiber";
import { AudioManagerProvider } from "./hooks";

const App = () => {
  return (
    <AudioManagerProvider>
      <Canvas shadows camera={{ position: [0, 16, 10], fov: 42 }}>
        <color attach="background" args={["#041c0b"]} />
      </Canvas>
    </AudioManagerProvider>
  );
};

export default App;
