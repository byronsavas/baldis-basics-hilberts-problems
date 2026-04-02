class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private queue: AudioBuffer[] = [];
  private queuePlaying = false;
  private currentQueueSource: AudioBufferSourceNode | null = null;

  init() {
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.connect(this.ctx.destination);
  }

  getContext(): AudioContext {
    if (!this.ctx) this.init();
    return this.ctx!;
  }

  async load(name: string, url: string): Promise<AudioBuffer> {
    if (this.buffers.has(name)) return this.buffers.get(name)!;
    const ctx = this.getContext();
    const resp = await fetch(url);
    const data = await resp.arrayBuffer();
    const buffer = await ctx.decodeAudioData(data);
    this.buffers.set(name, buffer);
    return buffer;
  }

  getBuffer(name: string): AudioBuffer | undefined {
    return this.buffers.get(name);
  }

  play(name: string, options?: { loop?: boolean; volume?: number }): AudioBufferSourceNode | null {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.ctx || !this.masterGain) return null;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = options?.loop ?? false;

    const gain = this.ctx.createGain();
    gain.gain.value = options?.volume ?? 1;
    source.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    return source;
  }

  playOneShot(name: string, volume = 1) {
    this.play(name, { volume });
  }

  play3D(
    name: string,
    position: { x: number; y: number; z: number },
    options?: { volume?: number; refDistance?: number },
  ): AudioBufferSourceNode | null {
    const buffer = this.buffers.get(name);
    if (!buffer || !this.ctx || !this.masterGain) return null;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const panner = this.ctx.createPanner();
    panner.panningModel = 'HRTF';
    panner.distanceModel = 'inverse';
    panner.refDistance = options?.refDistance ?? 10;
    panner.setPosition(position.x, position.y, position.z);

    const gain = this.ctx.createGain();
    gain.gain.value = options?.volume ?? 1;

    source.connect(panner);
    panner.connect(gain);
    gain.connect(this.masterGain);

    source.start();
    return source;
  }

  setListenerPosition(pos: { x: number; y: number; z: number }, forward: { x: number; y: number; z: number }) {
    if (!this.ctx) return;
    const listener = this.ctx.listener;
    if (listener.positionX) {
      listener.positionX.value = pos.x;
      listener.positionY.value = pos.y;
      listener.positionZ.value = pos.z;
      listener.forwardX.value = forward.x;
      listener.forwardY.value = forward.y;
      listener.forwardZ.value = forward.z;
    }
  }

  queueAudio(name: string) {
    const buffer = this.buffers.get(name);
    if (buffer) this.queue.push(buffer);
    if (!this.queuePlaying) this.playNextInQueue();
  }

  clearQueue() {
    this.queue.length = 0;
    if (this.currentQueueSource) {
      this.currentQueueSource.stop();
      this.currentQueueSource = null;
    }
    this.queuePlaying = false;
  }

  private playNextInQueue() {
    if (this.queue.length === 0 || !this.ctx || !this.masterGain) {
      this.queuePlaying = false;
      return;
    }
    this.queuePlaying = true;
    const buffer = this.queue.shift()!;
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.masterGain);
    source.onended = () => {
      this.currentQueueSource = null;
      this.playNextInQueue();
    };
    this.currentQueueSource = source;
    source.start();
  }

  setMasterVolume(v: number) {
    if (this.masterGain) this.masterGain.gain.value = v;
  }

  resume() {
    this.ctx?.resume();
  }
}

export const audioManager = new AudioManager();
