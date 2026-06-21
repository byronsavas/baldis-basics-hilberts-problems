import * as THREE from 'three';
import { NpcBase } from './NpcBase';
import type { Player } from '../Player';
import { SFXPlayer } from '../MusicGenerator';

export class Playtime extends NpcBase {
  playerSeen = false;
  disappointed = false;
  jumpRopeStarted = false;
  playCool = 0;

  constructor() {
    super('/textures/characters/Playtime.png', 8);
  }

  update(dt: number, playerPos: THREE.Vector3, player?: Player) {
    if (!this.active) return;

    this.coolDown -= dt;
    this.playCool -= dt;

    const dist = this.position.distanceTo(playerPos);

    if (player?.jumpRope) {
      // Back off during jump rope
      if (this.jumpRopeStarted) {
        const backDir = this.position.clone().sub(playerPos).normalize();
        this.applyMove(backDir.multiplyScalar(10));
        this.speed = 0;
        this.playCool = 15;
        this.jumpRopeStarted = false;
      }
      this.syncMesh();
      return;
    }

    // Chase or wander
    if (dist < 80 && this.playCool <= 0 && !this.disappointed) {
      this.playerSeen = true;
      this.speed = 20;
      this.setDestination(playerPos);
      this.moveAlongPath(dt);

      // Catch player
      if (dist < 4 && player && !player.jumpRope) {
        player.activateJumpRope();
        this.jumpRopeStarted = true;
        SFXPlayer.play('/audio/Mus_Playtime.wav', 0.5);
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

  setDisappointed() {
    this.disappointed = true;
  }
}
