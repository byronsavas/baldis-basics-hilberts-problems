import * as THREE from 'three';
import { assetUrl } from '../../engine/assetUrl';
import { NpcBase } from './NpcBase';

const IDLE_TEXTURE = '/textures/characters/HilbertIdle.png';
const CHASING_TEXTURE = '/textures/characters/HilbertChasing.png';
const SPRITE_HEIGHT = 8;
const IDLE_ASPECT = 329 / 1024;
const CHASING_ASPECT = 576 / 1024;
const SPRITE_WIDTH = SPRITE_HEIGHT * IDLE_ASPECT;
const textureLoader = new THREE.TextureLoader();

function configureSpriteTexture(tex: THREE.Texture) {
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
}

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
  private idleTexture: THREE.Texture;
  private chasingTexture: THREE.Texture;
  private usingChasingSprite = false;

  constructor() {
    super(IDLE_TEXTURE, SPRITE_HEIGHT, SPRITE_WIDTH);
    this.idleTexture = this.spriteMaterial.map!;
    configureSpriteTexture(this.idleTexture);
    this.chasingTexture = textureLoader.load(assetUrl(CHASING_TEXTURE));
    configureSpriteTexture(this.chasingTexture);
  }

  private updateChasingSprite() {
    const chasing = this.active && this.db;
    if (chasing === this.usingChasingSprite) return;

    this.usingChasingSprite = chasing;
    this.spriteMaterial.map = chasing ? this.chasingTexture : this.idleTexture;
    this.spriteMaterial.needsUpdate = true;
    this.spriteMesh.scale.x = chasing ? CHASING_ASPECT / IDLE_ASPECT : 1;
  }

  update(dt: number, playerPos: THREE.Vector3) {
    if (!this.active) {
      if (this.usingChasingSprite) {
        this.usingChasingSprite = false;
        this.spriteMaterial.map = this.idleTexture;
        this.spriteMaterial.needsUpdate = true;
        this.spriteMesh.scale.x = 1;
      }
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

    this.updateChasingSprite();
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

  private faceLookTarget = new THREE.Vector3();

  /** World position to aim the camera at when Baldi catches the player */
  getFaceLookTarget(): THREE.Vector3 {
    this.faceLookTarget.set(
      this.position.x,
      this.position.y + SPRITE_HEIGHT * 0.8125,
      this.position.z,
    );
    return this.faceLookTarget;
  }
}
