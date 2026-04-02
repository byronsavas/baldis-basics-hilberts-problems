import * as THREE from 'three';
import { NpcBase } from './NpcBase';
import type { Player } from '../Player';
import type { Baldi } from './Baldi';

export class Principal extends NpcBase {
  angry = false;
  inOffice = false;
  seesRuleBreak = false;
  timeSeenRuleBreak = 0;

  detentionPoint = new THREE.Vector3();
  playerDetentionPoint = new THREE.Vector3();
  officePosition = new THREE.Vector3();

  private detentions = 0;
  private lockTimes = [15, 30, 45, 60, 99];
  private whistleCooldown = 0;

  constructor() {
    super(0x4444bb, 6, 2);
  }

  setOffice(pos: THREE.Vector3, detentionPt: THREE.Vector3, playerDetentionPt: THREE.Vector3) {
    this.officePosition.copy(pos);
    this.detentionPoint.copy(detentionPt);
    this.playerDetentionPoint.copy(playerDetentionPt);
  }

  update(dt: number, playerPos: THREE.Vector3, player?: Player, baldi?: Baldi) {
    if (!this.active) return;

    this.coolDown -= dt;
    this.whistleCooldown -= dt;

    const distToPlayer = this.position.distanceTo(playerPos);

    // Check if principal can see rule-breaking player
    if (player && distToPlayer < 80 && player.guilt > 0 && !this.inOffice && !this.angry) {
      this.timeSeenRuleBreak += dt;
      if (this.timeSeenRuleBreak >= 0.5) {
        this.angry = true;
        this.targetPlayer(playerPos);
      }
    } else {
      this.timeSeenRuleBreak = 0;
    }

    // If angry, keep targeting player
    if (this.angry) {
      this.speed = 25;
      this.setDestination(playerPos);
      this.moveAlongPath(dt);

      // Check if caught player
      if (distToPlayer < 4 && player) {
        this.sendToDetention(player, baldi);
      }
    } else {
      // Patrol
      this.speed = 15;
      if (this.isAtDestination() && this.coolDown <= 0) {
        this.wander();

        // Random whistle
        if (this.whistleCooldown <= 0 && Math.random() < 0.1) {
          this.whistleCooldown = 30;
        }

        if (player) player.principalBugFixer = 1;
      }
      this.moveAlongPath(dt);
    }

    this.syncMesh();
  }

  private targetPlayer(playerPos: THREE.Vector3) {
    this.setDestination(playerPos);
    this.coolDown = 1;
  }

  private sendToDetention(player: Player, baldi?: Baldi) {
    this.angry = false;
    this.timeSeenRuleBreak = 0;

    // Warp principal to detention point
    this.position.copy(this.detentionPoint);

    // Move player to detention
    player.position.copy(this.playerDetentionPoint);
    player.position.y = player.height;

    // Get the lock time for this detention
    const lockIdx = Math.min(this.detentions, this.lockTimes.length - 1);
    const lockTime = this.lockTimes[lockIdx];
    this.detentions++;

    // Notify Baldi of the sound at the office
    if (baldi?.active) {
      baldi.hear(this.officePosition, 8);
    }

    // Return the lock time for door locking
    player.guilt = 0;
    player.guiltType = '';

    // Store detention info for door system to pick up
    this.lastDetentionLockTime = lockTime;
  }

  lastDetentionLockTime = 0;
}
