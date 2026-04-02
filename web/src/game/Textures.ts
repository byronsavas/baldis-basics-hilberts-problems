import * as THREE from 'three';

const loader = new THREE.TextureLoader();

function loadTex(path: string, repeatX = 1, repeatY = 1): THREE.Texture {
  const tex = loader.load(path);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createBrickTexture(): THREE.Texture {
  return loadTex('/textures/WhiteBrickWall.png', 2, 2);
}

export function createFloorTexture(): THREE.Texture {
  return loadTex('/textures/Carpet.png', 1, 1);
}

export function createHallFloorTexture(): THREE.Texture {
  return loadTex('/textures/TileFloor.png', 1, 1);
}

export function createCeilingTexture(): THREE.Texture {
  return loadTex('/textures/Ceiling.png', 1, 1);
}

export function createWallFadeTexture(): THREE.Texture {
  return loadTex('/textures/WallFade.png', 1, 1);
}

export function createDoorTexture(open = false): THREE.Texture {
  return loadTex(open ? '/textures/Door_80.png' : '/textures/Door_0.png');
}

export function createSwingDoorTexture(locked = false): THREE.Texture {
  return loadTex(locked ? '/textures/SwingDoor0_Locked.png' : '/textures/SwingDoor0.png');
}
