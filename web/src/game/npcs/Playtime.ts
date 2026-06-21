import * as THREE from 'three';
import { NpcBase } from './NpcBase';
import type { Player } from '../Player';
import { SFXPlayer } from '../MusicGenerator';
import { checkTrigger } from '../../engine/Physics';

const JUMP_ROPE_DISTANCE = 8;
const ENGAGE_COOLDOWN = 15;

export class Playtime extends NpcBase {
  playerSeen = false;
  disappointed = false;
  playCool = 0;

  constructor() {
    super('/textures/characters/Playtime.png', 8);
  }

  update(dt: number, playerPos: THREE.Vector3, player?: Player) {
    if (!this.active) return;

    this.coolDown -= dt;
    this.playCool -= dt;

    if (player?.jumpRope) {
      this.maintainInFrontOfPlayer(player);
      this.syncMesh();
      return;
    }

    const inChaseRange = checkTrigger(this.position, playerPos, 80);
    const caught = checkTrigger(this.position, playerPos, 5);

    // Chase or wander
    if (inChaseRange && this.playCool <= 0 && !this.disappointed) {
      this.playerSeen = true;
      this.speed = 20;
      this.setDestination(playerPos);
      this.moveAlongPath(dt);

      // Catch player (XZ distance — player eye height must not block the check)
      if (caught && player && !player.jumpRope) {
        player.activateJumpRope();
        player.faceToward(this.position.x, this.position.z);
        this.snapInFrontOfPlayer(player);
        SFXPlayer.playPlaytimeMusic(0.5);
      }
    } else {
      this.playerSeen = false;
      this.speed = 15;
      if (this.isAtDestination() && this.coolDown <= 0) {
        this.wanderHallway();
      }
      this.moveAlongPath(dt);
    }

    this.syncMesh();
  }

  private positionInFrontOf(player: Player, target: THREE.Vector3) {
    const forward = player.getForward();
    target.set(
      player.position.x + forward.x * JUMP_ROPE_DISTANCE,
      0,
      player.position.z + forward.z * JUMP_ROPE_DISTANCE,
    );
  }

  private snapInFrontOfPlayer(player: Player) {
    this.speed = 0;
    this.path = [];
    this.positionInFrontOf(player, this.position);
    this.resolveWallCollision();
  }

  private maintainInFrontOfPlayer(player: Player) {
    this.speed = 0;
    this.path = [];
    this.positionInFrontOf(player, this.position);
    this.resolveWallCollision();
  }

  setDisappointed() {
    this.disappointed = true;
  }

  /** After a completed jump rope session, ignore the player briefly. */
  startEngageCooldown(seconds = ENGAGE_COOLDOWN) {
    this.playCool = seconds;
  }
}
