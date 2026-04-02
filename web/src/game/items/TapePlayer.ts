import type { Baldi } from '../npcs/Baldi';

export class TapePlayer {
  playing = false;

  play(baldi?: Baldi) {
    this.playing = true;
    if (baldi?.active) {
      baldi.activateAntiHearing(30);
    }
  }
}
