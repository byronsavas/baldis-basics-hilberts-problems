export interface MathGameCallbacks {
  onCorrect(): void;
  onWrong(problemIndex: number): void;
  onComplete(): void;
}

export class MathGameUI {
  private el: HTMLElement;
  private num1El: HTMLElement;
  private signEl: HTMLElement;
  private num2El: HTMLElement;
  private answerEl: HTMLInputElement;
  private okBtn: HTMLElement;
  private resultDots: NodeListOf<Element>;
  private countEl: HTMLElement;

  private problem = 0;
  private solution = 0;
  private impossibleMode = false;
  private callbacks: MathGameCallbacks | null = null;
  private problemsWrong = 0;

  constructor() {
    this.el = document.getElementById('math-game')!;
    this.num1El = document.getElementById('math-num1')!;
    this.signEl = document.getElementById('math-sign')!;
    this.num2El = document.getElementById('math-num2')!;
    this.answerEl = document.getElementById('math-answer') as HTMLInputElement;
    this.okBtn = document.getElementById('math-ok')!;
    this.resultDots = document.querySelectorAll('.result-dot');
    this.countEl = document.getElementById('math-problem-count')!;

    this.okBtn.addEventListener('click', () => this.checkAnswer());
    this.answerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkAnswer();
    });
  }

  open(impossibleMode: boolean, callbacks: MathGameCallbacks) {
    this.impossibleMode = impossibleMode;
    this.callbacks = callbacks;
    this.problem = 0;
    this.problemsWrong = 0;

    this.resultDots.forEach((d) => {
      d.className = 'result-dot';
    });

    this.el.classList.add('active');
    this.newProblem();
  }

  close() {
    this.el.classList.remove('active');
  }

  private newProblem() {
    this.problem++;
    this.countEl.textContent = `Problem ${this.problem} of 3`;
    this.answerEl.value = '';
    this.answerEl.focus();

    if (this.problem <= 2 || !this.impossibleMode) {
      const num1 = Math.floor(Math.random() * 9) + 1;
      const num2 = Math.floor(Math.random() * 9) + 1;
      const isAdd = Math.random() > 0.5;

      this.num1El.textContent = String(num1);
      this.signEl.textContent = isAdd ? '+' : '-';
      this.num2El.textContent = String(num2);
      this.solution = isAdd ? num1 + num2 : num1 - num2;
    } else {
      // Impossible problem with gibberish
      this.num1El.textContent = this.randomGibberish();
      this.signEl.textContent = ['+', '-', '×', '÷', '√', '∞'][Math.floor(Math.random() * 6)];
      this.num2El.textContent = this.randomGibberish();
      this.solution = NaN;
    }
  }

  private randomGibberish(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let s = '';
    const len = Math.floor(Math.random() * 4) + 2;
    for (let i = 0; i < len; i++) {
      s += chars[Math.floor(Math.random() * chars.length)];
    }
    return s;
  }

  private checkAnswer() {
    const answer = parseInt(this.answerEl.value, 10);
    const dotIdx = this.problem - 1;

    if (answer === this.solution) {
      this.resultDots[dotIdx]?.classList.add('correct');
      this.callbacks?.onCorrect();
    } else {
      this.resultDots[dotIdx]?.classList.add('incorrect');
      this.problemsWrong++;
      this.callbacks?.onWrong(this.problem);
    }

    if (this.problem >= 3) {
      setTimeout(() => {
        this.close();
        this.callbacks?.onComplete();
      }, 800);
    } else {
      this.newProblem();
    }
  }
}
