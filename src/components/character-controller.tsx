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
  firstNonDeadPlayer?: boolean;
};

const idleThreshold = 0.1;

export const CharacterController = ({
  player = false,
  stage = "lobby",
  controls,
  state,
  firstNonDeadPlayer = false,
  ...props
}: Props) => {
  const isDead = state.getState("dead");
  const [animation, setAnimation] = React.useState<CharacterActionName>("idle");
  const rb = React.useRef<RapierRigidBody>(null);
  const cameraPos = React.useRef<THREE.Group>(null);
  const cameraLookAt = React.useRef<THREE.Vector3>(new THREE.Vector3());

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

  // 1. ALL HOOKS CALLED UNCONDITIONALLY
  useFrame(({ camera }) => {
    const character = rb.current;
    if (!character) return;

    if ((player && !isDead) || firstNonDeadPlayer) {
      if (stage === "game" || stage === "countdown") {
        const characterPosition = vec3(character.translation());

        // 1. Smoothly interpolate the "look at" target
        cameraLookAt.current.lerp(characterPosition, 0.1);

        const target = new THREE.Vector3()
          .copy(cameraLookAt.current)
          .add(new THREE.Vector3(0, 1, 0));
        camera.lookAt(target);

        // 2. Smoothly move the camera to the player's camera slot
        if (cameraPos.current) {
          const worldPosition = new THREE.Vector3();
          cameraPos.current.getWorldPosition(worldPosition);
          camera.position.lerp(worldPosition, 0.1);
        }
      }
    }
    // ---------------------------

    if (isDead) return;

    // REMOTE PLAYER SYNC
    if (!player) {
      const pos = state.getState("pos");
      const rot = state.getState("rot");
      if (pos) character.setTranslation(pos, true);
      if (rot) character.setRotation(rot, true);

      const action = state.getState("animation");
      if (action) updateAnimation(action);
      return;
    }

    // LOCAL MOVEMENT LOGIC
    if (stage !== "game") return;

    const { forward, backward, hi, jump, left, right } = get();
    const interacted = controls.isJoystickPressed();
    const rotVel = { x: 0, y: 0, z: 0 };
    const curVel = character.linvel();

    characterVel.set(0, 0, 0);

    const angle = controls.angle();
    const joyX = Math.sin(angle);
    const joyY = Math.cos(angle);

    if (forward || (interacted && joyY < -idleThreshold)) characterVel.z += MOVEMENT_SPEED;
    if (backward || (interacted && joyY > idleThreshold)) characterVel.z -= MOVEMENT_SPEED;
    if (left || (interacted && joyX < -idleThreshold)) rotVel.y += MOVEMENT_SPEED;
    if (right || (interacted && joyX > idleThreshold)) rotVel.y -= MOVEMENT_SPEED;

    character.setAngvel(rotVel, true);
    const eulerRot = euler().setFromQuaternion(quat(character.rotation()));
    characterVel.applyEuler(eulerRot);

    if ((jump || controls.isPressed("jump")) && !inAir.current && landed.current) {
      characterVel.y = JUMP_FORCE;
      inAir.current = true;
      landed.current = false;
    } else {
      characterVel.y = curVel.y;
    }

    inAir.current = Math.abs(characterVel.y) > 0.1;
    character.setLinvel(characterVel, true);
    state.setState("pos", character.translation());
    state.setState("rot", character.rotation());

    // Animation Calculation
    let nextAnim: CharacterActionName = "idle";
    const movement = Math.abs(characterVel.x) + Math.abs(characterVel.z);
    if (inAir.current && characterVel.y > 0.5) nextAnim = "jump_up";
    else if (inAir.current && characterVel.y < -0.5) nextAnim = "fall";
    else if (movement > 0.1) nextAnim = "run";
    else if (hi || controls.isPressed("hi")) nextAnim = "wave";

    updateAnimation(nextAnim);
    state.setState("animation", nextAnim);

    // Death Check
    if (character.translation().y < -FLOOR_HEIGHT * FLOORS.length && !state.getState("dead")) {
      state.setState("dead", true);
      setState("lastDead", state.getProfile(), true);
      playAudio(DeadMP3, true);
    }
  });

  const startingPos = state.getState("startingPos");

  React.useEffect(() => {
    const character = rb.current;
    if (!character || !startingPos) return;
    character.setTranslation(
      stage !== "lobby" ? { x: startingPos.x, y: 1, z: startingPos.z } : { x: 0, y: 2.3, z: 0 },
      true,
    );
    character.setGravityScale(stage === "game" ? 2.5 : 0, true);
    character.wakeUp();
  }, [stage]);

  // 2. STABILITY FIX: Never return null for the RigidBody
  if (!startingPos) return null;

  return (
    <RigidBody
      ref={rb}
      {...props}
      position={[startingPos.x, 1, startingPos.z]}
      colliders={false}
      enabledRotations={[false, true, false]}
      gravityScale={2.5}
      name={player ? "player" : "other"}
      onCollisionEnter={(e) => {
        if (e.other.rigidBodyObject?.name === "hexagon") {
          inAir.current = false;
          landed.current = true;
        }
      }}
    >
      <CapsuleCollider args={[0.1, 0.31]} position={[0, 0.43, 0]} />
      <group ref={cameraPos} position={[0, 4, -8]} />

      {/* 3. VISIBILITY CHECK: Only render the character model if alive */}
      {!isDead && (
        <Character
          animation={animation}
          scale={0.42}
          color={state.getProfile()?.color?.hexString || "#ffffff"}
          name={state.getProfile()?.name || "Player"}
        />
      )}
    </RigidBody>
  );
};
