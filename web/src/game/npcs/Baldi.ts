import * as THREE from 'three';
import { NpcBase } from './NpcBase';

const SPRITE_HEIGHT = 8;
const SPRITE_WIDTH = SPRITE_HEIGHT * (262 / 901);

export class Baldi extends NpcBase {
  baseTime = 2.5;
  baldiAnger = 0;
  baldiTempAnger = 0;
  baldiWait = 2.5;
  baldiSpeedScale = 1;
  antiHearing = false;
  antiHearingTime = 0;
  endless = false;
  db = false;

  angerRate = 0.5;
  angerRateRate = 0.05;
  angerFrequency = 45;
  timeToAnger = 45;

  private timeToMove = 2.5;
  private moveFrames = 0;
  private currentPriority = 0;
  private previous = new THREE.Vector3();
  private slapSpeed = 80;

  constructor() {
    super('/textures/characters/Hilbert.png', SPRITE_HEIGHT, SPRITE_WIDTH);
  }

  update(dt: number, playerPos: THREE.Vector3) {
    if (!this.active) {
      this.syncMesh();
      return;
    }

    if (this.timeToMove > 0) {
      this.timeToMove -= dt;
    } else {
      this.move();
    }

    if (this.coolDown > 0) this.coolDown -= dt;

    if (this.baldiTempAnger > 0) {
      this.baldiTempAnger -= 0.02 * dt;
    } else {
      this.baldiTempAnger = 0;
    }

    if (this.antiHearingTime > 0) {
      this.antiHearingTime -= dt;
    } else {
      this.antiHearing = false;
    }

    if (this.endless) {
      if (this.timeToAnger > 0) {
        this.timeToAnger -= dt;
      } else {
        this.timeToAnger = this.angerFrequency;
        this.getAngry(this.angerRate);
        this.angerRate += this.angerRateRate;
      }
    }

    if (this.moveFrames > 0) {
      this.moveFrames -= dt * 60;
      this.speed = this.slapSpeed * this.baldiSpeedScale;
      this.moveAlongPath(dt);
    } else {
      this.speed = 0;
    }

    const direction = playerPos.clone().sub(this.position);
    const dist = direction.length();
    if (dist < 120) {
      this.db = true;
      this.targetPlayer(playerPos);
    } else {
      this.db = false;
    }

    if (this.position.distanceTo(this.previous) < 0.1 && this.coolDown < 0) {
      this.wander();
    }

    this.syncMesh();
  }

  private move() {
    this.moveFrames = 10;
    this.baldiWait = this.baseTime - this.baldiAnger - this.baldiTempAnger;
    this.timeToMove = Math.max(0.1, this.baldiWait);
    this.previous.copy(this.position);
  }

  targetPlayer(playerPos: THREE.Vector3) {
    this.setDestination(playerPos);
    this.coolDown = 1;
    this.currentPriority = 0;
  }

  hear(soundPos: THREE.Vector3, priority: number) {
    if (this.antiHearing) return;
    if (priority >= this.currentPriority) {
      this.setDestination(soundPos);
      this.currentPriority = priority;
      this.coolDown = 1;
    }
  }

  getAngry(amount: number) {
    this.baldiAnger += amount;
    this.baldiWait = this.baseTime - this.baldiAnger - this.baldiTempAnger;
    this.slapSpeed = 60 + this.baldiAnger * 10;
  }

  getTempAngry(amount: number) {
    this.baldiTempAnger += amount;
    this.baldiWait = this.baseTime - this.baldiAnger - this.baldiTempAnger;
  }

  activateAntiHearing(duration: number) {
    this.antiHearing = true;
    this.antiHearingTime = duration;
    this.wander();
  }
}
