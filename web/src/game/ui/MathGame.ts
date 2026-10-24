import { inputManager } from '../../engine/InputManager';

export interface MathGameCallbacks {
  onCorrect(): void;
  onWrong(problemIndex: number): void;
  onClose(): void;
  onComplete(): void;
}

interface HilbertProblem {
  number: number;
  title: string;
  statement: string;
  /** Prompt shown above the answer input for the unsolvable problem */
  prompt: string;
}

const HILBERT_PROBLEMS: HilbertProblem[] = [
  {
    number: 8,
    title: "The Riemann Hypothesis",
    statement:
      "All non-trivial zeros of the analytical continuation of the Riemann zeta function ζ(s) have a real part equal to ½.",
    prompt: "Find a non-trivial zero of ζ(s) with Re(s) ≠ ½:",
  },
  {
    number: 1,
    title: "The Continuum Hypothesis",
    statement:
      "There is no set whose cardinality is strictly between that of the integers and the real numbers.",
    prompt: "Find |S| where ℵ₀ < |S| < 2^ℵ₀ :",
  },
  {
    number: 2,
    title: "Consistency of Arithmetic",
    statement:
      "Prove that the axioms of arithmetic are not self-contradictory.",
    prompt: "Enter a proof of consistency for PA:",
  },
  {
    number: 6,
    title: "Axiomatization of Physics",
    statement:
      "Give a mathematical treatment of the axioms of physics, in particular probability and mechanics.",
    prompt: "Enter the complete axiom set:",
  },
  {
    number: 16,
    title: "Topology of Algebraic Curves",
    statement:
      "What is the maximum number and mutual position of limit cycles for a polynomial vector field of degree n?",
    prompt: "H(n) for all n =",
  },
  {
    number: 15,
    title: "Schubert's Enumerative Calculus",
    statement:
      "Establish a rigorous foundation for Schubert's enumerative calculus of intersections in algebraic geometry.",
    prompt: "Rigorous intersection number =",
  },
  {
    number: 23,
    title: "Calculus of Variations",
    statement:
      "Further develop the methods of the calculus of variations to solve all boundary value problems.",
    prompt: "General solution =",
  },
];

const MOVEMENT_KEY_CODES = [
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
];

export class MathGameUI {
  private el: HTMLElement;
  private questionLabelEl: HTMLElement;
  private equationEl: HTMLElement;
  private answerEl: HTMLInputElement;
  private okBtn: HTMLElement;
  private resultBoxes: NodeListOf<Element>;
  private questionPanelEl: HTMLElement;
  private hilbertTextEl: HTMLElement;

  private problem = 0;
  private solution = 0;
  private notebookIndex = 0;
  private callbacks: MathGameCallbacks | null = null;
  private problemsWrong = 0;
  private focusRequestId = 0;
  private awaitingNext = false;

  constructor() {
    this.el = document.getElementById('math-game')!;
    this.questionLabelEl = document.getElementById('math-problem-label')!;
    this.equationEl = document.getElementById('math-equation')!;
    this.answerEl = document.getElementById('math-answer') as HTMLInputElement;
    this.okBtn = document.getElementById('math-ok')!;
    this.resultBoxes = document.querySelectorAll('.result-box');
    this.questionPanelEl = document.getElementById('math-question-panel')!;
    this.hilbertTextEl = document.getElementById('hilbert-problem-text')!;

    this.answerEl.type = 'text';
    this.answerEl.inputMode = 'numeric';
    this.answerEl.addEventListener('input', () => this.sanitizeAnswer());
    this.okBtn.addEventListener('click', () => this.checkAnswer());
    this.answerEl.addEventListener('keydown', (e) => {
      if (MOVEMENT_KEY_CODES.includes(e.code)) {
        e.preventDefault();
        return;
      }
      if (e.key === 'Enter' && !e.repeat) this.checkAnswer();
    });

    document.querySelectorAll('.keypad-key').forEach((btn) => {
      btn.addEventListener('click', () => {
        const key = btn.getAttribute('data-key');
        if (key) this.handleKeypad(key);
      });
    });
  }

  private isMovementKeyHeld(): boolean {
    return MOVEMENT_KEY_CODES.some((code) => inputManager.isKey(code));
  }

  private focusAnswerInput() {
    this.focusRequestId++;
    const requestId = this.focusRequestId;
    this.answerEl.blur();

    const tryFocus = () => {
      if (requestId !== this.focusRequestId) return;
      if (this.isMovementKeyHeld()) {
        requestAnimationFrame(tryFocus);
        return;
      }
      this.answerEl.focus({ preventScroll: true });
    };

    requestAnimationFrame(tryFocus);
  }

  open(notebookIndex: number, callbacks: MathGameCallbacks) {
    this.notebookIndex = notebookIndex;
    this.callbacks = callbacks;
    this.problem = 0;
    this.problemsWrong = 0;
    this.awaitingNext = false;

    this.resultBoxes.forEach((box) => {
      box.className = 'result-box';
    });

    this.el.classList.add('active');
    this.newProblem();
  }

  close() {
    this.focusRequestId++;
    this.awaitingNext = false;
    this.el.classList.remove('active');
    this.callbacks?.onClose();
  }

  private getHilbertProblem(): HilbertProblem {
    return HILBERT_PROBLEMS[this.notebookIndex % HILBERT_PROBLEMS.length];
  }

  private isShowingHilbertProblem(): boolean {
    return this.problem === 3;
  }

  private newProblem() {
    this.problem++;
    this.answerEl.value = '';
    this.awaitingNext = false;
    (this.okBtn as HTMLButtonElement).disabled = false;
    this.questionLabelEl.textContent = `SOLVE MATH Q${this.problem}:`;
    this.focusAnswerInput();

    if (this.problem <= 2) {
      this.showArithmeticMode();

      const num1 = Math.floor(Math.random() * 9) + 1;
      const num2 = Math.floor(Math.random() * 9) + 1;
      const isAdd = Math.random() > 0.5;
      const sign = isAdd ? '+' : '-';

      this.equationEl.textContent = `${num1}${sign}${num2}=`;
      this.solution = isAdd ? num1 + num2 : num1 - num2;
    } else {
      const hp = this.getHilbertProblem();
      this.showHilbertMode(hp);
      this.solution = NaN;
    }
  }

  private showArithmeticMode() {
    this.questionPanelEl.classList.remove('hilbert-mode');
    this.equationEl.classList.remove('hidden');
    this.hilbertTextEl.classList.add('hidden');
    this.answerEl.inputMode = 'numeric';
    this.answerEl.readOnly = false;
    this.answerEl.placeholder = '';
  }

  private showHilbertMode(hp: HilbertProblem) {
    this.questionPanelEl.classList.add('hilbert-mode');
    this.equationEl.classList.add('hidden');
    this.hilbertTextEl.classList.remove('hidden');
    this.hilbertTextEl.innerHTML =
      `<div class="hilbert-title">Hilbert's Problem #${hp.number}: ${hp.title}</div>` +
      `<div class="hilbert-statement">${hp.statement}</div>` +
      `<div class="hilbert-prompt">${hp.prompt}</div>`;
    this.answerEl.inputMode = 'text';
    this.answerEl.readOnly = false;
    this.answerEl.placeholder = '';
  }

  private handleKeypad(key: string) {
    if (key === 'C') {
      this.answerEl.value = '';
      this.focusAnswerInput();
      return;
    }

    if (key === '-') {
      if (this.isShowingHilbertProblem()) {
        this.answerEl.value = this.answerEl.value.startsWith('-')
          ? this.answerEl.value.slice(1)
          : `-${this.answerEl.value}`;
      } else if (!this.answerEl.value) {
        this.answerEl.value = '-';
      }
      this.focusAnswerInput();
      return;
    }

    this.answerEl.value += key;
    this.sanitizeAnswer();
    this.focusAnswerInput();
  }

  private sanitizeAnswer() {
    if (!this.isShowingHilbertProblem()) {
      this.answerEl.value = this.answerEl.value
        .replace(/[^0-9-]/g, '')
        .replace(/(?!^)-/g, '');
    }
  }

  private checkAnswer() {
    if (this.awaitingNext) return;

    const boxIdx = this.problem - 1;
    const box = this.resultBoxes[boxIdx];
    if (box?.classList.contains('correct') || box?.classList.contains('incorrect')) {
      return;
    }

    this.awaitingNext = true;
    (this.okBtn as HTMLButtonElement).disabled = true;

    const answer = parseInt(this.answerEl.value, 10);

    if (answer === this.solution) {
      box?.classList.add('correct');
      // Great-job lines only for the arithmetic questions, not the final Hilbert problem
      if (this.problem < 3) {
        this.callbacks?.onCorrect();
      }
    } else {
      box?.classList.add('incorrect');
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
