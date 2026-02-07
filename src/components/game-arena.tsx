import {
  FLOOR_HEIGHT,
  FLOORS,
  HEX_X_SPACING,
  HEX_Z_SPACING,
  NB_COLUMNS,
  NB_ROWS,
} from "@/constants";
import { Hexagon } from "./hexagon";
import React from "react";
import { RPC } from "playroomkit";

type HexData = {
  hexagonKey: string;
};

export const GameArena = () => {
  const [hexagonHit, setHexagonHit] = React.useState<Record<string, boolean>>({});
  const rpcRegistered = React.useRef(false);

  React.useEffect(() => {
    if (!rpcRegistered.current) {
      RPC.register("hexagonHit", async (data: HexData) => {
        setHexagonHit((prev) => ({
          ...prev,
          [data.hexagonKey]: true,
        }));
      });
      rpcRegistered.current = true;
    }
  }, []);

  return (
    <group
      position-x={-((NB_COLUMNS - 1) / 2) * HEX_X_SPACING}
      position-z={-((NB_ROWS - 1) / 2) * HEX_Z_SPACING}
    >
      {/* HEXAGONS */}
      {FLOORS.map(({ color }, floorIndex) => (
        <group key={floorIndex} position-y={floorIndex * -FLOOR_HEIGHT}>
          {[...Array(NB_ROWS)].map((_, rowIndex) => (
            <group
              key={rowIndex}
              position-z={rowIndex * HEX_Z_SPACING}
              position-x={rowIndex % 2 ? HEX_X_SPACING / 2 : 0}
            >
              {[...Array(NB_COLUMNS)].map((_, columnIndex) => {
                const hexagonKey = `${floorIndex}-${rowIndex}-${columnIndex}`;
                return (
                  <Hexagon
                    onHit={() => {
                      setHexagonHit((prev) => ({
                        ...prev,
                        [hexagonKey]: true,
                      }));
                      RPC.call("hexagonHit", { hexagonKey }, RPC.Mode.ALL);
                    }}
                    hit={hexagonHit[hexagonKey]}
                    key={columnIndex}
                    position-x={columnIndex * HEX_X_SPACING}
                    color={color}
                  />
                );
              })}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};
