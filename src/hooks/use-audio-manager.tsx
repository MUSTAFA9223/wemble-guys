import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { BgMP3 } from "../assets";

/* ---------- Types ---------- */

interface AudioManagerContextType {
  playAudio: (file: string, force?: boolean) => void;
  audioEnabled: boolean;
  setAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
}

/* ---------- Context ---------- */

const AudioManagerContext = createContext<AudioManagerContextType>({
  playAudio: () => {
    throw new Error("AudioManager not initialized");
  },
  audioEnabled: false,
  setAudioEnabled: () => {
    throw new Error("AudioManager not initialized");
  },
});

interface Props {
  children: ReactNode;
}

export const AudioManagerProvider = ({ children }: Props) => {
  const lastAudioPlayed = useRef<number>(Date.now());
  const [audioEnabled, setAudioEnabled] = useState<boolean>(false);

  const playAudio = (file: string, force: boolean = false) => {
    if (!audioEnabled && !force) return;

    const now = Date.now();
    if (!force && now - lastAudioPlayed.current < 100) return;

    lastAudioPlayed.current = now;

    const audio = new Audio(file);
    audio.play().catch(() => {});
  };

  const bgAudio = useRef<HTMLAudioElement>(new Audio(BgMP3));

  useEffect(() => {
    const audio = bgAudio.current;

    if (!audioEnabled) {
      audio.pause();
      return;
    }

    audio.loop = true;
    audio.play().catch(() => {});
  }, [audioEnabled]);

  return (
    <AudioManagerContext.Provider value={{ playAudio, audioEnabled, setAudioEnabled }}>
      {children}
    </AudioManagerContext.Provider>
  );
};

export const useAudioManager = (): AudioManagerContextType => {
  return useContext(AudioManagerContext);
};
