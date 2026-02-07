import { NEXT_STAGE, TIMER_STAGE, type StageKeyType } from "@/constants";
import { isHost, Joystick, onPlayerJoin, useMultiplayerState, type PlayerState } from "playroomkit";
import React from "react";

type GameContextType = {
  stage: StageKeyType;
  timer: number;
  host: boolean;
  players: Player[];
  startGame: () => void;
};

const GameContext = React.createContext<GameContextType>({
  stage: "lobby",
  timer: -1,
  host: false,
  players: [],
  startGame: () => new Error("GameContext: Game is not initialized!"),
});

type Props = {
  children: React.ReactNode;
};

type Player = {
  state: PlayerState;
  controls: Joystick;
};

export const GameProvider = ({ children }: Props) => {
  const init = React.useRef(false);

  const [stage, setStage] = useMultiplayerState<StageKeyType>("gameStage", "lobby");
  const [timer, setTimer] = useMultiplayerState<number>("timer", TIMER_STAGE.lobby);

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [soloGame, setSoloGame] = React.useState(false);

  const host = isHost();

  const startGame = () => {
    setStage("countdown");
    setTimer(TIMER_STAGE.countdown);
    if (players.length !== 1) return;
    setSoloGame(true);
  };

  React.useEffect(() => {
    if (!host || stage === "lobby") return;

    const timeout = setTimeout(() => {
      let newTime = stage === "game" ? timer + 1 : timer - 1;
      if (newTime === 0) {
        const nextStage = NEXT_STAGE[stage];
        setStage(nextStage, true);
        newTime = TIMER_STAGE[nextStage];
      }
      setTimer(newTime, true);
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [host, timer, stage, soloGame]);

  React.useEffect(() => {
    if (init.current) return;
    init.current = true;
    onPlayerJoin((state) => {
      const controls = new Joystick(state, {
        type: "angular",
        buttons: [
          { id: "jump", label: "Jump" },
          { id: "wave", label: "Wave" },
        ],
      });
      const newPlayer = { state, controls };
      setPlayers((players) => [...players, newPlayer]);
      state.onQuit(() => {
        setPlayers((players) => players.filter((p) => p.state.id !== state.id));
      });
    });
  }, []);

  return (
    <GameContext.Provider
      value={{
        stage,
        timer,
        host,
        players,
        startGame,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  return React.useContext(GameContext);
};
