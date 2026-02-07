import {
  FLOOR_HEIGHT,
  FLOORS,
  HEX_X_SPACING,
  HEX_Z_SPACING,
  NB_COLUMNS,
  NB_ROWS,
} from "@/constants";
import { Hexagon } from "./hexagon";

export const GameArena = () => {
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
              {[...Array(NB_COLUMNS)].map((_, columnIndex) => (
                <Hexagon key={columnIndex} position-x={columnIndex * HEX_X_SPACING} color={color} />
              ))}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};
