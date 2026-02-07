import { AudioManagerProvider } from "./use-audio-manager";
import { GameProvider } from "./use-game";

type Props = {
  children: React.ReactNode;
};
const AppProvider = ({ children }: Props) => (
  <GameProvider>
    <AudioManagerProvider>{children}</AudioManagerProvider>
  </GameProvider>
);

export default AppProvider;

export * from "./use-audio-manager";
export * from "./use-game";
