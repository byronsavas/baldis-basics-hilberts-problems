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

function viewportSize() {
  const vv = window.visualViewport;
  return {
    width: Math.max(1, vv?.width ?? window.innerWidth),
    height: Math.max(1, vv?.height ?? window.innerHeight),
  };
}

function resizeRenderer() {
  const { width, height } = viewportSize();
  renderer.setSize(width, height);
  // Nearest-filter pixel art. Phones stay at 1× so a chase scene stays fill-rate cheap.
  const dprCap = inputManager.usesTouchControls() ? 1 : 1.25;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
}

inputManager.init(canvas);
resizeRenderer();
window.addEventListener('resize', resizeRenderer);
window.visualViewport?.addEventListener('resize', resizeRenderer);
window.visualViewport?.addEventListener('scroll', resizeRenderer);

function syncTouchClass() {
  document.body.classList.toggle('touch-controls', inputManager.usesTouchControls());
}
syncTouchClass();
window.matchMedia('(pointer: coarse)').addEventListener('change', syncTouchClass);

document.addEventListener('touchmove', (e) => {
  const target = e.target as HTMLElement | null;
  if (target?.closest('#math-question-panel, input, textarea, #options-menu')) return;
  e.preventDefault();
}, { passive: false });

document.addEventListener('gesturestart', (e) => {
  e.preventDefault();
});

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
