import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { Character } from "./character";
import type { Joystick, PlayerState } from "playroomkit";
import React from "react";
import type { StageKeyType } from "@/constants";

type Props = RigidBodyProps & {
  player?: boolean;
  controls: Joystick;
  state: PlayerState;
  stage?: StageKeyType;
};

export const CharacterController = ({ player = false,stage="lobby", controls, state, ...props }: Props) => {
  const rb = React.useRef<RapierRigidBody>(null);

  return (
    <RigidBody ref={rb} {...props} colliders={false} lockRotations>
      <CapsuleCollider args={[0.1, 0.31]} position={[0, 0.43, -0.017]} />
      <Character
        scale={0.42}
        color={state.getProfile().color.hexString}
        name={state.getProfile().name}
      />
    </RigidBody>
  );
};
