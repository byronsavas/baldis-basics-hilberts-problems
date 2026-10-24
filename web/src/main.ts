import * as THREE from 'three';
import { gameLoop } from './engine/GameLoop';
import { inputManager } from './engine/InputManager';
import { sceneManager } from './engine/SceneManager';
import { assetUrl } from './engine/assetUrl';
import { WarningScene } from './scenes/WarningScene';
import { MainMenuScene } from './scenes/MainMenuScene';
import { SchoolScene } from './scenes/SchoolScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ResultsScene } from './scenes/ResultsScene';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;

document.documentElement.style.setProperty(
  '--portrait-texture',
  `url("${assetUrl('textures/characters/Hilbert.png')}")`,
);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false,
  powerPreference: 'high-performance',
});
renderer.setSize(window.innerWidth, window.innerHeight);
// Nearest-filter pixel art; cap DPR so Retina isn't rendering 4× pixels
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
});

inputManager.init(canvas);

document.addEventListener('selectstart', (e) => {
  const tag = (e.target as HTMLElement).tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA') e.preventDefault();
});

document.addEventListener('dragstart', (e) => {
  if ((e.target as HTMLElement).tagName === 'IMG') e.preventDefault();
});

sceneManager.register(new WarningScene());
sceneManager.register(new MainMenuScene());
sceneManager.register(new SchoolScene('story', renderer));
sceneManager.register(new SchoolScene('endless', renderer));
sceneManager.register(new GameOverScene());
sceneManager.register(new ResultsScene());

gameLoop.onUpdate((dt) => {
  sceneManager.update(dt);
  inputManager.endFrame();
});

sceneManager.loadScene('warning');
gameLoop.start();
