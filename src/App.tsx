import { Canvas } from "@react-three/fiber";
import AppProvider from "@/hooks";
import { Experience, UI } from "@/components";
import { Loader } from "@react-three/drei";
import { Physics } from "@react-three/rapier";

const App = () => {
  return (
    <AppProvider>
      <Loader />
      <Canvas shadows camera={{ position: [0, 16, 10], fov: 42 }}>
        <color attach="background" args={["#041c0b"]} />
        <Physics debug>
          <Experience />
        </Physics>
      </Canvas>
      <UI />
    </AppProvider>
  );
};

export default App;
