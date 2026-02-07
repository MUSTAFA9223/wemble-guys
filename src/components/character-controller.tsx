import {
  CapsuleCollider,
  euler,
  quat,
  RapierRigidBody,
  RigidBody,
  vec3,
  type RigidBodyProps,
} from "@react-three/rapier";
import { Character, type CharacterActionName } from "./character";
import React from "react";
import {
  FLOOR_HEIGHT,
  FLOORS,
  JUMP_FORCE,
  MOVEMENT_SPEED,
  type KeyboardControlsAction,
  type StageKeyType,
} from "@/constants";
import { useKeyboardControls } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useAudioManager, type GameJoyStick, type GamePlayerState } from "@/hooks";
import * as THREE from "three";
import { DeadMP3 } from "@/assets";
import { setState } from "playroomkit";

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
  const [animation, setAnimation] = React.useState<CharacterActionName>("idle");

  const rb = React.useRef<RapierRigidBody>(null);
  const cameraPos = React.useRef<THREE.Group>(null);

  const cameraLookAt = React.useRef<THREE.Vector3>(null);

  const inAir = React.useRef(true);
  const landed = React.useRef(false);

  const [, get] = useKeyboardControls<KeyboardControlsAction>();

  const characterVel = React.useMemo(() => new THREE.Vector3(), []);

  const animationRef = React.useRef<CharacterActionName>("idle");

  const updateAnimation = React.useCallback((action: CharacterActionName) => {
    if (animationRef.current === action) return;
    animationRef.current = action;
    setAnimation(action);
  }, []);

  const { playAudio } = useAudioManager();

  useFrame(({ camera }) => {
    const character = rb.current;
    const cameraPosition = cameraPos.current;
    if (!character || stage !== "game" || !cameraPosition) return;

    // other character as per there position and rotation
    if (!player) {
      const pos = state.getState("pos");
      const rot = state.getState("rot");
      if (pos) {
        character.setTranslation(pos, true);
      }
      if (rot) {
        character.setRotation(rot, true);
      }

      const action = state.getState("animation");
      if (!action) return;
      updateAnimation(action);
      return;
    }

    //if you are the character
    const characterPosition = vec3(character.translation());
    if (!cameraLookAt.current) {
      cameraLookAt.current = characterPosition;
    }
    cameraLookAt.current.lerp(characterPosition, 0.03);
    const lookOffset = new THREE.Vector3(0, 2, 0); // look 1.5 units above character
    const target = new THREE.Vector3().copy(characterPosition).add(lookOffset);
    camera.lookAt(target);
    const worldPosition = characterPosition;
    cameraPosition.getWorldPosition(worldPosition);
    camera.position.lerp(worldPosition, 0.03);

    characterVel.set(0, 0, 0);

    const { forward, backward, hi, jump, left, right } = get();
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
      rotVel.y += MOVEMENT_SPEED;
    }
    if (right || (interacted && joyX > idleThreshold)) {
      rotVel.y -= MOVEMENT_SPEED;
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

    // animating the character body
    const movement = Math.abs(characterVel.x) + Math.abs(characterVel.z);

    const midAir = inAir.current;
    let animation: CharacterActionName = "idle";
    if (midAir && characterVel.y > 2) {
      animation = "jump_up";
    } else if (midAir && characterVel.y < 5) {
      animation = "fall";
    } else if (movement > 1 || midAir) {
      animation = "run";
    } else if (hi || controls.isPressed("hi")) {
      animation = "wave";
    }

    updateAnimation(animation);
    state.setState("animation", animation);

    if (character.translation().y < -FLOOR_HEIGHT * FLOORS.length && !state.getState("dead")) {
      state.setState("dead", true);
      setState("lastDead", state.getProfile(), true);
      playAudio(DeadMP3, true);
      playAudio("Dead", true);
    }
  });

  const startingPos = state.getState("startingPos");
  if (!startingPos) return null;

  return (
    <RigidBody
      ref={rb}
      {...props}
      position-x={stage === "game" ? startingPos.x : 0}
      position-z={stage === "game" ? startingPos.z : 0}
      colliders={false}
      enabledRotations={[false, true, false]}
      canSleep={false}
      gravityScale={stage === "game" ? 2.5 : 0}
      name={player ? "player" : "other"}
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
      <group ref={cameraPos} position={[0, 4, -8]} />
      <Character
        animation={animation}
        scale={0.42}
        color={state.getProfile().color.hexString}
        name={state.getProfile().name}
      />
    </RigidBody>
  );
};
