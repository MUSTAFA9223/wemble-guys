import { Environment, OrbitControls } from "@react-three/drei";
import { CharacterController, GameArena, Hexagon, Podium } from "@/components";
import { MedievalCafeHDR } from "@/assets";
import { useGame } from "@/hooks";
import React from "react";

export const Experience = () => {
  const { players, stage, me } = useGame();

  // Compute which characters to render
  const charactersToRender = React.useMemo(() => {
    if (stage === "lobby") {
      // Only render the current player in the lobby
      return players.filter((p) => p.state.id === me.id);
    }
    // Render all players in game or other stages
    return players;
  }, [players, stage, me.id]);

  return (
    <>
      <OrbitControls target={[0, 1, 0]} />
      <Environment files={MedievalCafeHDR} />

      {stage === "winner" ? (
        <Podium />
      ) : (
        <>
          {stage !== "lobby" ? <GameArena /> : <Hexagon color="green" position-y={2} />}

          {charactersToRender.map(({ state, controls }) => (
            <CharacterController
              key={state.id}
              state={state}
              controls={controls}
              player={me.id === state.id}
              stage={stage}
              position-y={2}
            />
          ))}
        </>
      )}
    </>
  );
};
