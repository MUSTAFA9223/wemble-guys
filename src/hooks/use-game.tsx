import {
  HEX_X_SPACING,
  HEX_Z_SPACING,
  NB_COLUMNS,
  NB_ROWS,
  NEXT_STAGE,
  TIMER_STAGE,
  type ButtonControlsAction,
  type StageKeyType,
} from "@/constants";
import {
  getState,
  isHost,
  Joystick,
  myPlayer,
  onPlayerJoin,
  useMultiplayerState,
  type PlayerState,
} from "playroomkit";
import React from "react";
import type { Vector, Rotation } from "@dimforge/rapier3d-compat";
import type { CharacterActionName } from "@/components";
import { randFloat } from "three/src/math/MathUtils.js";

type GameContextType = {
  stage: StageKeyType;
  timer: number;
  host: boolean;
  players: Player[];
  winner: ReturnType<GamePlayerState["getProfile"]>;
  startGame: () => void;
  me: PlayerState;
};

const GameContext = React.createContext<GameContextType>({
  stage: "lobby",
  timer: -1,
  host: false,
  players: [],
  me: myPlayer(),
  winner: myPlayer()?.getProfile(),
  startGame: () => new Error("GameContext: Game is not initialized!"),
});

type PlayerStateKeyMap = {
  pos: Vector | null;
  rot: Rotation | null;
  animation: CharacterActionName;
  dead: boolean;
  startingPos: { x: number; z: number };
};

export interface GameJoyStick extends Joystick {
  isPressed: (id: ButtonControlsAction) => boolean;
}
export interface GamePlayerState extends PlayerState {
  getState<K extends keyof PlayerStateKeyMap>(key: K): PlayerStateKeyMap[K] | undefined;
  setState<K extends keyof PlayerStateKeyMap>(key: K, value: PlayerStateKeyMap[K]): void;
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
  const host = isHost();
  const me = myPlayer();

  const [players, setPlayers] = React.useState<Player[]>([]);
  const [soloGame, setSoloGame] = React.useState(false);
  const [winner, setWinner] = React.useState<ReturnType<GamePlayerState["getProfile"]>>(
    me.getProfile(),
  );

  const [stage, setStage] = useMultiplayerState<StageKeyType>("gameStage", "lobby");
  const [timer, setTimer] = useMultiplayerState<number>("timer", TIMER_STAGE.lobby);

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
        if (nextStage === "lobby") {
          players.forEach((p) => {
            p.state.setState("dead", false);
            p.state.setState("pos", null);
            p.state.setState("rot", null);
          });
        }
        setStage(nextStage, true);
        newTime = TIMER_STAGE[nextStage];
      } else {
        if (stage === "game") {
          const playersAlive = players.filter((p) => !p.state.getState("dead"));
          if (playersAlive.length <= (soloGame ? 0 : 1)) {
            setStage("winner");
            if (playersAlive.length === 1) {
              setWinner(playersAlive[0].state.getProfile());
            } else {
              setWinner(getState("lastDead"));
            }
            newTime = TIMER_STAGE.winner;
          }
        }
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
    onPlayerJoin((state: GamePlayerState) => {
      const controls = new Joystick(state, {
        type: "angular",
        buttons: [
          { id: "jump", label: "Jump" },
          { id: "hi", label: "Wave" },
        ],
      });
      const newPlayer = { state, controls };

      if (host) {
        state.setState("dead", stage === "game");
        state.setState("startingPos", {
          x: randFloat(
            (-(NB_COLUMNS - 1) * HEX_X_SPACING) / 2,
            ((NB_COLUMNS - 1) * HEX_X_SPACING) / 2,
          ),
          z: randFloat((-(NB_ROWS - 1) * HEX_Z_SPACING) / 2, ((NB_ROWS - 1) * HEX_Z_SPACING) / 2),
        });
      }

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
        winner,
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
