import { NEXT_STAGE, TIMER_STAGE, type ButtonControlsAction, type StageKeyType } from "@/constants";
import {
  isHost,
  Joystick,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
  type PlayerState,
} from "playroomkit";
import React from "react";
import type { Vector, Rotation } from "@dimforge/rapier3d-compat";

type GameContextType = {
  stage: StageKeyType;
  timer: number;
  host: boolean;
  players: Player[];
  startGame: () => void;
  me: PlayerState;
};

const GameContext = React.createContext<GameContextType>({
  stage: "lobby",
  timer: -1,
  host: false,
  players: [],
  me: myPlayer(),
  startGame: () => new Error("GameContext: Game is not initialized!"),
});

type PlayerStateKeyMap = {
  pos: Vector;
  rot: Rotation;
};

export interface GameJoyStick extends Joystick {
  isPressed: (id: ButtonControlsAction) => boolean;
}
export interface GamePlayerState extends PlayerState {
  getState<K extends keyof PlayerStateKeyMap>(key: K): PlayerStateKeyMap[K] | undefined;
  setState<K extends keyof PlayerStateKeyMap>(key: K,value:PlayerStateKeyMap[K]): void;
}

type Player = {
  state: GamePlayerState;
  controls: GameJoyStick;
};

type Props = {
  children: React.ReactNode;
};

export const GameProvider = ({ children }: Props) => {
  const init = React.useRef(false);

  const [stage, setStage] = useMultiplayerState<StageKeyType>("gameStage", "lobby");
  const [timer, setTimer] = useMultiplayerState<number>("timer", TIMER_STAGE.lobby);

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [soloGame, setSoloGame] = React.useState(false);

  const host = isHost();
  const me = myPlayer();

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
        me,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = (): GameContextType => {
  return React.useContext(GameContext);
};
