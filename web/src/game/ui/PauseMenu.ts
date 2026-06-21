export class PauseMenuUI {
  private el: HTMLElement;
  private continueBtn: HTMLElement;
  private optionsBtn: HTMLElement;
  private quitBtn: HTMLElement;

  onContinue: (() => void) | null = null;
  onOptions: (() => void) | null = null;
  onQuit: (() => void) | null = null;

  constructor() {
    this.el = document.getElementById('pause-menu')!;
    this.continueBtn = document.getElementById('btn-continue')!;
    this.optionsBtn = document.getElementById('btn-options')!;
    this.quitBtn = document.getElementById('btn-quit')!;

    this.continueBtn.addEventListener('click', () => this.onContinue?.());
    this.optionsBtn.addEventListener('click', () => this.onOptions?.());
    this.quitBtn.addEventListener('click', () => this.onQuit?.());
  }

  show() {
    this.el.classList.add('active');
  }

  hide() {
    this.el.classList.remove('active');
  }

  isVisible(): boolean {
    return this.el.classList.contains('active');
  }
}
