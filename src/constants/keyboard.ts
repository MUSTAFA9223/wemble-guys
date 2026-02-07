const createKeyboardMap = <
  T extends readonly {
    name: string;
    keys: readonly string[];
  }[],
>(
  map: T,
) => {
  return {
    const: map,
    runtime: map.map((m) => ({
      name: m.name,
      keys: [...m.keys],
    })),
  };
};

export const keyboard = createKeyboardMap([
  { name: "forward", keys: ["ArrowUp", "KeyW"] },
  { name: "backward", keys: ["ArrowDown", "KeyS"] },
  { name: "left", keys: ["ArrowLeft", "KeyA"] },
  { name: "right", keys: ["ArrowRight", "KeyD"] },
  { name: "run", keys: ["Shift"] },
  { name: "jump", keys: ["Space"] },
  { name: "hi", keys: ["Enter", "KeyF"] },
] as const);

export type KeyboardControlsAction = (typeof keyboard.const)[number]["name"];
export type ButtonControlsAction = Exclude<KeyboardControlsAction,"forward"|"backward"|"left"|"right">
