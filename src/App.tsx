import { Canvas } from "@react-three/fiber";
import AppProvider from "@/hooks";
import { Experience, UI } from "@/components";
import { KeyboardControls, Loader } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import { keyboard } from "./constants";

const App = () => {
  return (
    <AppProvider>
      <KeyboardControls map={keyboard.runtime}>
        <Loader />
        <Canvas shadows camera={{ position: [0, 16, 10], fov: 42 }}>
          <color attach="background" args={["#041c0b"]} />
          <Physics debug>
            <Experience />
          </Physics>
        </Canvas>
        <UI />
      </KeyboardControls>
    </AppProvider>
  );
};

export default App;
