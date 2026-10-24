import * as THREE from 'three';
import { gameLoop } from '../engine/GameLoop';
import { inputManager, InputAction } from '../engine/InputManager';
import { audioManager } from '../engine/AudioManager';
import { sceneManager } from '../engine/SceneManager';
import { checkTrigger, type AABB } from '../engine/Physics';
import { pathfinder } from './Pathfinding';
import { SchoolMap } from './Map';
import defaultLevelData from '../levels/default.json';
import { validateLevel } from './LevelData';
import { Player } from './Player';
import { GameCamera } from './Camera';
import { Baldi } from './npcs/Baldi';
import { Principal } from './npcs/Principal';
import { Playtime } from './npcs/Playtime';
import { FirstPrize } from './npcs/FirstPrize';
import { Bully } from './npcs/Bully';
import { Crafters } from './npcs/Crafters';
import { GottaSweep } from './npcs/GottaSweep';
import { ItemSystem, ItemId } from './items/ItemSystem';
import { Notebook } from './items/Notebook';
import { Door } from './items/Door';
import { SwingingDoor } from './items/SwingingDoor';
import { BsodaSpray } from './items/BsodaSpray';
import { AlarmClock } from './items/AlarmClock';
import { HUD } from './ui/HUD';
import { MathGameUI } from './ui/MathGame';
import { PauseMenuUI } from './ui/PauseMenu';
import { optionsMenuUI } from './ui/OptionsMenu';
import { JumpRopeUI } from './ui/JumpRope';
import { MusicPlayer, SpookyMusic, SFXPlayer } from './MusicGenerator';

export class GameController {
  scene = new THREE.Scene();
  map: SchoolMap;
  player: Player;
  camera: GameCamera;

  // NPCs
  baldi: Baldi;
  principal: Principal;
  playtime: Playtime;
  firstPrize: FirstPrize;
  bully: Bully;
  crafters: Crafters;
  gottaSweep: GottaSweep;

  // Systems
  items: ItemSystem;
  notebooks: Notebook[] = [];
  doors: Door[] = [];
  swingingDoors: SwingingDoor[] = [];
  bsodaProjectiles: BsodaSpray[] = [];
  alarmClocks: AlarmClock[] = [];

  // UI
  hud: HUD;
  mathGameUI: MathGameUI;
  pauseMenuUI: PauseMenuUI;
  jumpRopeUI: JumpRopeUI;

  // State
  mode = 'story';
  notebookCount = 0;
  failedNotebooks = 0;
  exitsReached = 0;
  spoopMode = false;
  finaleMode = false;
  gamePaused = false;
  learningActive = false;
  gameOverDelay = 0.5;

  private wasJumpRoping = false;
  private canvas: HTMLCanvasElement | null = null;
  private onCanvasClick = () => {
    if (!this.gamePaused && !this.player.gameOver && !inputManager.isPointerLocked()) {
      inputManager.lockPointer();
    }
  };
  private itemPickups: THREE.Mesh[] = [];
  private schoolMusic: MusicPlayer;
  private spookyMusic: SpookyMusic;
  private baldiWasNear = false;
  private baldiQuoteCooldown = 0;
  private static readonly BALDI_QUOTE_RADIUS = 15;
  private static readonly BALDI_QUOTE_COOLDOWN = 25;
  private catchGlitchStarted = false;
  private catchFade = 0;
  private catchPhase: 'camera' | 'fade' | 'done' = 'camera';
  private static readonly CATCH_FADE_DURATION = 2.5;
  private readonly activeWalls: AABB[] = [];

  constructor() {
    this.map = new SchoolMap(validateLevel(defaultLevelData));
    this.player = new Player();
    this.camera = new GameCamera();
    this.items = new ItemSystem();

    // NPCs
    this.baldi = new Baldi();
    this.principal = new Principal();
    this.playtime = new Playtime();
    this.firstPrize = new FirstPrize();
    this.bully = new Bully();
    this.crafters = new Crafters();
    this.gottaSweep = new GottaSweep();

    // Music
    this.schoolMusic = new MusicPlayer();
    this.spookyMusic = new SpookyMusic();

    // UI
    this.hud = new HUD();
    this.mathGameUI = new MathGameUI();
    this.pauseMenuUI = new PauseMenuUI();
    this.jumpRopeUI = new JumpRopeUI();
  }

  init(mode: string) {
    this.mode = mode;
    this.gamePaused = false;
    this.baldiWasNear = false;
    this.baldiQuoteCooldown = 0;
    this.wasJumpRoping = false;
    this.catchGlitchStarted = false;
    this.catchFade = 0;
    this.catchPhase = 'camera';
    this.gameOverDelay = 0.5;
    GameController.setCatchFade(0);
    localStorage.setItem('CurrentMode', mode);

    // Setup scene
    this.scene.add(this.map.group);
    this.scene.background = new THREE.Color(0x87ceeb);
    this.scene.fog = new THREE.Fog(0x87ceeb, 100, 300);

    // Setup pathfinder
    pathfinder.setWaypoints(this.map.waypoints);

    // Setup player
    this.player.spawn(this.map.playerSpawn);
    this.player.setWalls(this.map.wallAABBs);

    // Create notebooks
    for (const pos of this.map.notebookPositions) {
      const nb = new Notebook(pos);
      this.notebooks.push(nb);
      this.scene.add(nb.mesh);
    }

    // Create doors
    for (const doorDef of this.map.doorPositions) {
      if (doorDef.isSwinging) {
        const sd = new SwingingDoor(doorDef.pos, doorDef.horizontal);
        this.swingingDoors.push(sd);
        this.scene.add(sd.mesh);
      } else {
        const d = new Door(doorDef.pos, doorDef.horizontal);
        this.doors.push(d);
        this.scene.add(d.mesh);
      }
    }

    // Place NPCs
    this.setupNPCs();

    // Create some item pickups in the world
    this.spawnItemPickups();

    // Setup items
    this.items.reset();

    // HUD
    this.hud.show();
    this.updateNotebookCount();

    if (mode === 'endless') {
      this.baldi.endless = true;
    }

    // Wire pause menu buttons
    this.pauseMenuUI.onContinue = () => this.unpauseGame();
    this.pauseMenuUI.onOptions = () => {
      this.pauseMenuUI.hide();
      optionsMenuUI.show();
    };
    this.pauseMenuUI.onQuit = () => this.exitGame();
    optionsMenuUI.onBack = () => {
      optionsMenuUI.hide();
      this.pauseMenuUI.show();
    };

    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.canvas.addEventListener('click', this.onCanvasClick);

    // Lock mouse
    inputManager.lockPointer();

    // Resume audio context and start school music
    audioManager.resume();
    this.schoolMusic.start();
    SFXPlayer.playBaldiIntro();
  }

  private setupNPCs() {
    // Baldi starts in the main north-south hallway (center of cell, not on a wall edge)
    this.baldi.position.copy(this.map.gridToWorld(2, 9));
    this.baldi.active = false; // Activated after first notebook
    this.scene.add(this.baldi.mesh);
    this.baldi.syncMesh();

    // Principal
    this.principal.position.copy(this.map.gridToWorld(9, 5));
    this.principal.setOffice(
      new THREE.Vector3(20, 4, 20),
      new THREE.Vector3(18, 4, 20),
      new THREE.Vector3(22, 4, 20),
    );
    this.scene.add(this.principal.mesh);
    this.principal.syncMesh();

    // Playtime — active from the start (like the original game)
    this.playtime.position.copy(this.map.gridToWorld(9, 13));
    this.scene.add(this.playtime.mesh);
    this.playtime.syncMesh();

    // First Prize
    this.firstPrize.position.copy(this.map.gridToWorld(14, 5));
    this.firstPrize.active = false;
    this.scene.add(this.firstPrize.mesh);
    this.firstPrize.syncMesh();

    // Bully
    this.scene.add(this.bully.mesh);

    // Crafters
    this.crafters.position.copy(this.map.gridToWorld(14, 14));
    this.crafters.baldiTeleportPoint.copy(this.map.gridToWorld(2, 9));
    this.crafters.playerTeleportPoint.copy(this.map.gridToWorld(4, 9));
    this.scene.add(this.crafters.mesh);
    this.crafters.syncMesh();

    // Gotta Sweep
    this.gottaSweep.setOrigin(this.map.gridToWorld(9, 9));
    this.scene.add(this.gottaSweep.mesh);
    this.gottaSweep.syncMesh();
  }

  private spawnItemPickups() {
    const pickupItems = [
      { pos: new THREE.Vector3(30, 4, 50), itemId: ItemId.ZestyBar },
      { pos: new THREE.Vector3(150, 4, 50), itemId: ItemId.BSODA },
      { pos: new THREE.Vector3(30, 4, 130), itemId: ItemId.HilbertsLeastFavoriteTape },
      { pos: new THREE.Vector3(110, 4, 50), itemId: ItemId.WDNoSquee },
      { pos: new THREE.Vector3(70, 4, 130), itemId: ItemId.AlarmClock },
      { pos: new THREE.Vector3(150, 4, 130), itemId: ItemId.SafetyScissors },
      { pos: new THREE.Vector3(50, 4, 50), itemId: ItemId.BigOlBoots },
      { pos: new THREE.Vector3(130, 4, 50), itemId: ItemId.Keys },
      { pos: new THREE.Vector3(90, 4, 130), itemId: ItemId.YellowDoorLock },
    ];

    for (const pickup of pickupItems) {
      const geo = new THREE.BoxGeometry(1, 1, 1);
      const mat = new THREE.MeshLambertMaterial({ color: this.getItemColor(pickup.itemId) });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pickup.pos);
      mesh.position.y = 2;
      mesh.userData = { itemId: pickup.itemId, collected: false };
      mesh.name = `Pickup_${pickup.itemId}`;
      this.scene.add(mesh);
      this.itemPickups.push(mesh);
    }
  }

  private getItemColor(id: number): number {
    const colors: Record<number, number> = {
      [ItemId.ZestyBar]: 0xff6600,
      [ItemId.YellowDoorLock]: 0xffff00,
      [ItemId.Keys]: 0xcccc00,
      [ItemId.BSODA]: 0x0088ff,
      [ItemId.Quarter]: 0xaaaaaa,
      [ItemId.HilbertsLeastFavoriteTape]: 0x888888,
      [ItemId.AlarmClock]: 0xff0000,
      [ItemId.WDNoSquee]: 0x00aa00,
      [ItemId.SafetyScissors]: 0xcccccc,
      [ItemId.BigOlBoots]: 0x663300,
      [ItemId.Teleporter]: 0xffdd00,
    };
    return colors[id] ?? 0xffffff;
  }

  update(dt: number) {
    if (this.player.gameOver) {
      this.handleGameOver(dt);
      return;
    }

    if (this.learningActive) {
      gameLoop.setTimeScale(0);
      return;
    }

    this.handlePauseInput();

    if (this.gamePaused) {
      return;
    }

    // Ensure time is running
    if (gameLoop.getTimeScale() !== 1) {
      gameLoop.setTimeScale(1);
    }

    // Item selection
    if (inputManager.getActionDown(InputAction.UseItem)) {
      this.useItem();
    }

    const scroll = inputManager.getScrollDelta();
    if (scroll > 0) this.items.decreaseSelection();
    else if (scroll < 0) this.items.increaseSelection();

    if (inputManager.getActionDown(InputAction.Slot0)) { this.items.selectSlot(0); }
    if (inputManager.getActionDown(InputAction.Slot1)) { this.items.selectSlot(1); }
    if (inputManager.getActionDown(InputAction.Slot2)) { this.items.selectSlot(2); }

    // Interact
    if (inputManager.getActionDown(InputAction.Interact)) {
      this.handleInteract();
    }

    // Update player
    this.player.update(dt);

    // Update camera
    this.camera.update(dt, this.player, this.baldi.getFaceLookTarget());

    // Get active wall AABBs (including closed doors)
    this.updatePlayerWalls();

    // Update NPCs
    const pp = this.player.position;
    this.baldi.update(dt, pp);
    this.principal.update(dt, pp, this.player, this.baldi);
    this.playtime.update(dt, pp, this.player);
    this.firstPrize.update(dt, pp, this.player);
    this.bully.update(dt, pp);
    this.crafters.update(dt, pp, this.notebookCount, this.player, this.baldi);
    this.gottaSweep.update(dt, pp, this.player);

    // Billboard all NPC sprites to face the camera
    const cam = this.camera.camera;
    this.baldi.billboardToCamera(cam);
    this.principal.billboardToCamera(cam);
    this.playtime.billboardToCamera(cam);
    this.firstPrize.billboardToCamera(cam);
    this.bully.billboardToCamera(cam);
    this.crafters.billboardToCamera(cam);
    this.gottaSweep.billboardToCamera(cam);

    // Update notebooks
    for (const nb of this.notebooks) {
      nb.update(dt, pp, this.mode === 'endless');
    }

    // Update doors
    for (const d of this.doors) d.update(dt);
    for (const sd of this.swingingDoors) sd.update(dt, this.notebookCount);

    // Update projectiles
    for (const bs of this.bsodaProjectiles) {
      bs.update(dt);
      // Push NPCs hit by BSODA
      if (bs.alive) {
        this.checkBsodaHits(bs);
      }
    }
    this.bsodaProjectiles = this.bsodaProjectiles.filter((b) => b.alive);

    // Update alarm clocks
    for (const ac of this.alarmClocks) {
      ac.update(dt, this.baldi);
    }
    this.alarmClocks = this.alarmClocks.filter((a) => a.alive);

    // Check NPC triggers
    this.checkNpcTriggers();
    this.updateBaldiProximityQuotes(dt, pp);

    this.updateJumpRope(dt);

    // Update HUD
    this.hud.updateStamina(this.player.stamina, this.player.maxStamina);
    this.hud.updateItemSelection(this.items.selectedSlot);
    this.hud.updateItemName(this.items.getCurrentItem());
    this.hud.showWarning(this.player.stamina < 20);
    for (let i = 0; i < 3; i++) {
      this.hud.updateItemSlot(i, this.items.slots[i]);
    }

    // Update audio listener
    const forward = this.player.getForward();
    audioManager.setListenerPosition(this.player.position, forward);

    // Check win condition
    this.checkExits();
  }

  private updateJumpRope(dt: number) {
    if (this.player.jumpRope && !this.wasJumpRoping) {
      this.camera.resetJump();
      inputManager.unlockPointer();
      this.jumpRopeUI.open({
        getJumpHeight: () => this.camera.jumpHeight,
        onSuccess: () => {},
        onFail: () => {},
        onComplete: () => {
          SFXPlayer.stopPlaytimeMusic();
          this.player.deactivateJumpRope();
          this.playtime.startEngageCooldown();
        },
      });
    } else if (!this.player.jumpRope && this.wasJumpRoping) {
      this.jumpRopeUI.close();
      inputManager.lockPointer();
    }

    this.wasJumpRoping = this.player.jumpRope;

    if (this.player.jumpRope) {
      this.jumpRopeUI.update(dt);
    }
  }

  private handleInteract() {
    const pp = this.player.position;

    // Check notebooks
    for (const nb of this.notebooks) {
      if (nb.isInteractable(pp)) {
        nb.collect();
        this.collectNotebook();
        return;
      }
    }

    // Check item pickups
    for (const pickup of this.itemPickups) {
      if (!pickup.userData.collected && pp.distanceTo(pickup.position) < 8) {
        const itemId = pickup.userData.itemId as number;
        if (this.items.collectItem(itemId)) {
          pickup.userData.collected = true;
          pickup.visible = false;
        }
        return;
      }
    }

    // Check doors
    for (const door of this.doors) {
      if (pp.distanceTo(door.position) < 10 && !door.isLocked()) {
        door.open();
        if (this.baldi.active && door.silentOpens <= 0) {
          this.baldi.hear(door.position, 1);
        }
        if (door.silentOpens > 0) door.silentOpens--;
        return;
      }
    }

    // Check swinging doors
    for (const sd of this.swingingDoors) {
      if (pp.distanceTo(sd.position) < 10) {
        if (sd.isLocked && this.notebookCount < 2) {
          // Blocked - need more notebooks
        } else {
          sd.open();
        }
        return;
      }
    }
  }

  private collectNotebook() {
    this.notebookCount++;
    this.updateNotebookCount();

    if (this.mode === 'endless') {
      localStorage.setItem('CurrentBooks', String(this.notebookCount));
    }

    // Open math game (problems 1–2: arithmetic, problem 3: unsolved Hilbert problem)
    this.learningActive = true;
    this.schoolMusic.suspend();
    this.spookyMusic.suspend();
    SFXPlayer.playLearnMusic();
    this.mathGameUI.open(this.notebookCount - 1, {
      onCorrect: () => { SFXPlayer.playCorrectAnswer(); },
      onWrong: (problemIndex: number) => {
        SFXPlayer.playWrongAnswer();
        if (!this.spoopMode) {
          this.activateSpoopMode();
        }
        if (problemIndex <= 2) {
          this.baldi.getTempAngry(0.15);
        } else {
          this.baldi.getAngry(0.2);
          this.failedNotebooks++;
        }
      },
      onClose: () => { SFXPlayer.stopLearnMusic(); },
      onComplete: () => {
        this.deactivateLearningGame();
      },
    });
  }

  private deactivateLearningGame() {
    this.learningActive = false;
    gameLoop.setTimeScale(1);
    inputManager.lockPointer();
    this.schoolMusic.resume();
    this.spookyMusic.resume();

    // Refill stamina
    this.player.stamina = this.player.maxStamina;

    // Activate Baldi after first notebook
    if (this.notebookCount === 1) {
      this.baldi.active = true;
    }

    // At 7 notebooks, activate finale
    if (this.notebookCount === 7 && this.mode === 'story') {
      this.activateFinaleMode();
    }
  }

  private activateSpoopMode() {
    if (this.spoopMode) return;
    this.spoopMode = true;

    SFXPlayer.playEvent();
    this.schoolMusic.stop();
    this.spookyMusic.start();

    // Change scene atmosphere
    this.scene.background = new THREE.Color(0x220000);
    this.scene.fog = new THREE.Fog(0x220000, 50, 200);

    // Activate all NPCs
    this.playtime.active = true;
    this.firstPrize.active = true;
    this.baldi.active = true;
  }

  private activateFinaleMode() {
    this.finaleMode = true;
    // All exits become reachable
  }

  private updateNotebookCount() {
    this.hud.updateNotebooks(this.notebookCount, this.mode);
  }

  private useItem() {
    const itemId = this.items.useItem();
    if (itemId === 0) return;

    const pp = this.player.position.clone();
    const forward = this.player.getForward();

    switch (itemId) {
      case ItemId.ZestyBar:
        this.player.stamina = this.player.maxStamina;
        break;

      case ItemId.BSODA: {
        const spray = new BsodaSpray(pp.clone().add(forward.clone().multiplyScalar(2)), forward);
        this.bsodaProjectiles.push(spray);
        this.scene.add(spray.mesh);
        break;
      }

      case ItemId.HilbertsLeastFavoriteTape:
        if (this.baldi.active) {
          this.baldi.activateAntiHearing(30);
        }
        break;

      case ItemId.AlarmClock: {
        const clock = new AlarmClock(pp.clone().add(forward.clone().multiplyScalar(3)));
        this.alarmClocks.push(clock);
        this.scene.add(clock.mesh);
        break;
      }

      case ItemId.WDNoSquee:
        // Silence nearest doors
        for (const d of this.doors) {
          if (pp.distanceTo(d.position) < 15) {
            d.silence();
          }
        }
        break;

      case ItemId.SafetyScissors:
        // Escape jump rope
        if (this.player.jumpRope) {
          SFXPlayer.stopPlaytimeMusic();
          this.player.deactivateJumpRope();
          this.playtime.setDisappointed();
        }
        // Cut Bully escape
        if (this.firstPrize.position.distanceTo(pp) < 10) {
          this.firstPrize.goCrazy();
        }
        break;

      case ItemId.BigOlBoots:
        this.player.activateBoots();
        break;

      case ItemId.YellowDoorLock:
        // Lock nearest door
        for (const d of this.doors) {
          if (pp.distanceTo(d.position) < 10) {
            d.lock(15);
            break;
          }
        }
        break;

      case ItemId.Keys:
        // Unlock nearest locked door
        for (const d of this.doors) {
          if (pp.distanceTo(d.position) < 10 && d.isLocked()) {
            d.unlock();
            break;
          }
        }
        break;

      case ItemId.Quarter:
        // Use on BSODA machine - give BSODA
        this.items.collectItem(ItemId.BSODA);
        break;

      case ItemId.Teleporter:
        // Teleport to random location
        const wpId = pathfinder.getRandomWaypoint();
        const pos = pathfinder.getWaypointPosition(wpId);
        this.player.position.copy(pos);
        this.player.position.y = this.player.height;
        break;
    }
  }

  private checkBsodaHits(spray: BsodaSpray) {
    const npcs = [this.baldi, this.principal, this.playtime, this.firstPrize, this.crafters, this.gottaSweep];
    for (const npc of npcs) {
      if (!npc.active) continue;
      if (checkTrigger(spray.position, npc.position, 5)) {
        // Push NPC away from spray
        const pushDir = spray.direction.clone();
        pushDir.y = 0;
        npc.position.add(pushDir.multiplyScalar(spray.speed * 0.05));
        npc.syncMesh();
      }
    }
  }

  private updateBaldiProximityQuotes(dt: number, pp: THREE.Vector3) {
    if (this.baldiQuoteCooldown > 0) {
      this.baldiQuoteCooldown -= dt;
    }

    if (!this.baldi.active || this.learningActive || this.player.gameOver) {
      this.baldiWasNear = false;
      return;
    }

    const nearBaldi = checkTrigger(pp, this.baldi.position, GameController.BALDI_QUOTE_RADIUS);
    if (nearBaldi && !this.baldiWasNear && this.baldiQuoteCooldown <= 0) {
      if (SFXPlayer.playRandomHilbertQuote()) {
        this.baldiQuoteCooldown = GameController.BALDI_QUOTE_COOLDOWN;
      }
    }
    this.baldiWasNear = nearBaldi;
  }

  private checkNpcTriggers() {
    const pp = this.player.position;

    // Baldi catch check
    if (this.baldi.active && checkTrigger(pp, this.baldi.position, 3)) {
      this.player.gameOver = true;
      this.gameOverDelay = 0.5;
      this.hud.hide();
      this.player.faceToward(this.baldi.position.x, this.baldi.position.z);
      this.camera.update(0, this.player, this.baldi.getFaceLookTarget());
    }

    // Bully interaction
    if (this.bully.active && checkTrigger(pp, this.bully.position, 4)) {
      const stolenSlot = this.bully.tryStealItem(this.items.slots);
      if (stolenSlot !== null) {
        this.items.loseItem(stolenSlot);
      }
    }

    // Auto-open doors for NPCs
    const allNpcs = [this.baldi, this.principal, this.playtime, this.firstPrize, this.gottaSweep];
    for (const npc of allNpcs) {
      if (!npc.active) continue;
      for (const door of this.doors) {
        if (checkTrigger(npc.position, door.position, 5)) {
          door.open();
        }
      }
      for (const sd of this.swingingDoors) {
        if (checkTrigger(npc.position, sd.position, 5) && !sd.isLocked) {
          sd.open();
        }
      }
    }
  }

  private updatePlayerWalls() {
    const walls = this.activeWalls;
    walls.length = 0;
    for (const wall of this.map.wallAABBs) walls.push(wall);
    for (const d of this.doors) {
      const aabb = d.getActiveAABB();
      if (aabb) walls.push(aabb);
    }
    for (const sd of this.swingingDoors) {
      const aabb = sd.getActiveAABB();
      if (aabb) walls.push(aabb);
    }
    this.player.setWalls(walls);
    this.baldi.setWalls(walls);
    this.principal.setWalls(walls);
    this.playtime.setWalls(walls);
    this.firstPrize.setWalls(walls);
    this.crafters.setWalls(walls);
    this.gottaSweep.setWalls(walls);
  }

  private checkExits() {
    if (this.mode === 'story' && this.notebookCount >= 7 && this.finaleMode) {
      for (const exitPos of this.map.exitPositions) {
        if (checkTrigger(this.player.position, exitPos, 8)) {
          this.exitsReached++;
          if (this.exitsReached >= 3) {
            SFXPlayer.playWin();
            if (this.failedNotebooks >= 7) {
              sceneManager.loadScene('secret');
            } else {
              sceneManager.loadScene('results');
            }
            return;
          }
        }
      }
    }
  }

  private handleGameOver(dt: number) {
    gameLoop.setTimeScale(0);

    if (!this.catchGlitchStarted) {
      this.catchGlitchStarted = true;
      this.schoolMusic.stop();
      this.spookyMusic.stop();
      SFXPlayer.stopPlaytimeMusic();
      SFXPlayer.stopLearnMusic();
      SFXPlayer.playCatchGlitch();
      inputManager.unlockPointer();
    }

    if (this.catchPhase === 'camera') {
      this.gameOverDelay -= dt * 0.5;
      this.camera.setFarClipPlane(this.gameOverDelay * 400);
      this.camera.update(dt, this.player, this.baldi.getFaceLookTarget());

      if (this.gameOverDelay <= 0) {
        this.catchPhase = 'fade';
        this.catchFade = 0;
      }
      return;
    }

    if (this.catchPhase === 'fade') {
      this.catchFade += dt / GameController.CATCH_FADE_DURATION;
      GameController.setCatchFade(Math.min(1, this.catchFade));
      this.camera.update(dt, this.player, this.baldi.getFaceLookTarget());

      if (this.catchFade >= 1) {
        this.finishCatchSequence();
      }
    }
  }

  private finishCatchSequence() {
    if (this.catchPhase === 'done') return;
    this.catchPhase = 'done';

    if (this.mode === 'endless') {
      const current = this.notebookCount;
      const high = parseInt(localStorage.getItem('HighBooks') ?? '0', 10);
      if (current > high) {
        localStorage.setItem('HighBooks', String(current));
      }
    }

    gameLoop.setTimeScale(1);
    sceneManager.loadScene('mainmenu');
  }

  private static setCatchFade(opacity: number) {
    const el = document.getElementById('catch-fade');
    if (el) el.style.opacity = String(opacity);
  }

  pauseGame() {
    this.gamePaused = true;
    gameLoop.setTimeScale(0);
    this.pauseMenuUI.show();
    this.schoolMusic.suspend();
    this.spookyMusic.suspend();
    inputManager.unlockPointer();
  }

  private handlePauseInput() {
    if (!inputManager.getActionDown(InputAction.Pause) || this.gamePaused) return;
    this.pauseGame();
  }

  unpauseGame() {
    this.gamePaused = false;
    gameLoop.setTimeScale(1);
    this.pauseMenuUI.hide();
    optionsMenuUI.hide();
    this.schoolMusic.resume();
    this.spookyMusic.resume();
    inputManager.lockPointer();
  }

  exitGame() {
    this.gamePaused = false;
    gameLoop.setTimeScale(1);
    this.pauseMenuUI.hide();
    optionsMenuUI.hide();
    inputManager.unlockPointer();
    sceneManager.loadScene('mainmenu');
  }

  dispose() {
    this.schoolMusic.stop();
    this.spookyMusic.stop();
    SFXPlayer.stopPlaytimeMusic();
    SFXPlayer.stopLearnMusic();
    SFXPlayer.stopCatchGlitch();
    GameController.setCatchFade(0);
    this.hud.hide();
    this.pauseMenuUI.hide();
    optionsMenuUI.hide();
    this.mathGameUI.close();
    this.jumpRopeUI.close();
    inputManager.onPointerLockLost = null;
    inputManager.onPointerLockGained = null;
    this.canvas?.removeEventListener('click', this.onCanvasClick);
    this.canvas = null;

    while (this.scene.children.length > 0) {
      this.scene.remove(this.scene.children[0]);
    }
  }
}
