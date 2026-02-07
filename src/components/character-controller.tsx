import {
  CapsuleCollider,
  euler,
  quat,
  RapierRigidBody,
  RigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import { Character } from "./character";
import React from "react";
import {
  JUMP_FORCE,
  MOVEMENT_SPEED,
  type KeyboardControlsAction,
  type StageKeyType,
} from "@/constants";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { GameJoyStick, GamePlayerState } from "@/hooks";
import * as THREE from "three";

type Props = RigidBodyProps & {
  player?: boolean;
  controls: GameJoyStick;
  state: GamePlayerState;
  stage?: StageKeyType;
};

const idleThreshold = 0.1;

export const CharacterController = ({
  player = false,
  stage = "lobby",
  controls,
  state,
  ...props
}: Props) => {
  const rb = React.useRef<RapierRigidBody>(null);

  const inAir = React.useRef(true);
  const landed = React.useRef(false);

  const [, get] = useKeyboardControls<KeyboardControlsAction>();

  const characterVel = React.useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const character = rb.current;
    if (!character || stage === "lobby" || stage !== "game") return;

    if (!player) {
      const pos = state.getState("pos");
      const rot = state.getState("rot");
      if (pos) {
        character.setTranslation(pos, true);
      }
      if (rot) {
        character.setRotation(rot, true);
      }
      return;
    }
    characterVel.set(0, 0, 0);
    // character
    const { forward, backward, hi, jump, left, right, run } = get();
    const interacted = controls.isJoystickPressed();
    const rotVel = {
      x: 0,
      y: 0,
      z: 0,
    };

    const curVel = character.linvel();
    characterVel.x = 0;
    characterVel.y = 0;
    characterVel.z = 0;

    const angle = controls.angle();
    const joyX = Math.sin(angle);
    const joyY = Math.cos(angle);

    if (forward || (interacted && joyY < -idleThreshold)) {
      characterVel.z += MOVEMENT_SPEED;
    }
    if (backward || (interacted && joyY > idleThreshold)) {
      characterVel.z -= MOVEMENT_SPEED;
    }
    if (left || (interacted && joyX < -idleThreshold)) {
      characterVel.x += MOVEMENT_SPEED;
    }
    if (right || (interacted && joyX > idleThreshold)) {
      characterVel.x -= MOVEMENT_SPEED;
    }
    character.setAngvel(rotVel, true);
    const eulerRot = euler().setFromQuaternion(quat(character.rotation()));
    characterVel.applyEuler(eulerRot);

    if ((jump || controls.isPressed("jump")) && !inAir.current && landed.current) {
      characterVel.y += JUMP_FORCE;
      inAir.current = true;
      landed.current = false;
    } else {
      characterVel.y = curVel.y;
    }

    if (Math.abs(characterVel.y) > 1) {
      inAir.current = true;
      landed.current = false;
    } else {
      inAir.current = false;
    }
    character.setLinvel(characterVel, true);
    state.setState("pos", character.translation());
    state.setState("rot", character.rotation());
  });

  return (
    <RigidBody
      ref={rb}
      {...props}
      colliders={false}
      enabledRotations={[false, true, false]}
      canSleep={false}
      gravityScale={stage === "game" ? 2.5 : 0}
      onCollisionEnter={(e) => {
        const otherObject = e.other.rigidBodyObject;
        const character = rb.current;
        if (!otherObject || !character) return;
        if (otherObject.name === "hexagon") {
          inAir.current = false;
          landed.current = true;
          const curVel = character.linvel();
          curVel.y = 0;
          character.setLinvel(curVel, true);
        }
      }}
    >
      <CapsuleCollider args={[0.1, 0.31]} position={[0, 0.43, -0.017]} />
      <Character
        scale={0.42}
        color={state.getProfile().color?.hexString}
        name={state.getProfile().name}
      />
    </RigidBody>
  );
};
