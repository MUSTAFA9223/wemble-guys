import { Environment, OrbitControls } from "@react-three/drei";
import { CharacterController, GameArena, Hexagon } from "@/components";
import { MedievalCafeHDR } from "@/assets";
import { useGame } from "@/hooks";

export const Experience = () => {
  const { players, stage, me } = useGame();

  return (
    <>
      <OrbitControls target={[0, 1, 0]} />
      <Environment files={MedievalCafeHDR} />
      {stage !== "lobby" ? <GameArena /> : <Hexagon color="green" position-y={2} />}
      {players.map(({ state, controls }) => (
        <CharacterController
          position-y={2}
          key={state.id}
          state={state}
          controls={controls}
          player={me.id === state.id}
        />
      ))}
    </>
  );
};
