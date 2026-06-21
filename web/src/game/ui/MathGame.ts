export interface MathGameCallbacks {
  onCorrect(): void;
  onWrong(problemIndex: number): void;
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

export class MathGameUI {
  private el: HTMLElement;
  private num1El: HTMLElement;
  private signEl: HTMLElement;
  private num2El: HTMLElement;
  private answerEl: HTMLInputElement;
  private okBtn: HTMLElement;
  private resultDots: NodeListOf<Element>;
  private countEl: HTMLElement;
  private mathProblemEl: HTMLElement;
  private hilbertTextEl: HTMLElement;
  private hilbertTitleEl: HTMLElement;

  private problem = 0;
  private solution = 0;
  private notebookIndex = 0;
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
    this.mathProblemEl = document.getElementById('math-problem')!;
    this.hilbertTextEl = document.getElementById('hilbert-problem-text')!;
    this.hilbertTitleEl = document.getElementById('hilbert-notebook-title')!;

    this.answerEl.type = 'text';
    this.answerEl.inputMode = 'numeric';
    this.answerEl.addEventListener('input', () => {
      if (!this.isShowingHilbertProblem()) {
        this.answerEl.value = this.answerEl.value.replace(/[^0-9-]/g, '').replace(/(?!^)-/g, '');
      }
    });
    this.okBtn.addEventListener('click', () => this.checkAnswer());
    this.answerEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.checkAnswer();
    });
  }

  open(notebookIndex: number, callbacks: MathGameCallbacks) {
    this.notebookIndex = notebookIndex;
    this.callbacks = callbacks;
    this.problem = 0;
    this.problemsWrong = 0;

    const hp = this.getHilbertProblem();
    this.hilbertTitleEl.textContent = `Hilbert's Problem #${hp.number}: ${hp.title}`;

    this.resultDots.forEach((d) => {
      d.className = 'result-dot';
    });

    this.el.classList.add('active');
    this.newProblem();
  }

  close() {
    this.el.classList.remove('active');
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
    this.answerEl.focus();

    if (this.problem <= 2) {
      this.countEl.textContent = `Problem ${this.problem} of 3`;
      this.showArithmeticMode();

      const num1 = Math.floor(Math.random() * 9) + 1;
      const num2 = Math.floor(Math.random() * 9) + 1;
      const isAdd = Math.random() > 0.5;

      this.num1El.textContent = String(num1);
      this.signEl.textContent = isAdd ? '+' : '-';
      this.num2El.textContent = String(num2);
      this.solution = isAdd ? num1 + num2 : num1 - num2;
    } else {
      const hp = this.getHilbertProblem();
      this.countEl.textContent = `Problem 3 of 3 — UNSOLVED`;
      this.showHilbertMode(hp);
      this.solution = NaN;
    }
  }

  private showArithmeticMode() {
    this.mathProblemEl.style.display = 'flex';
    this.hilbertTextEl.classList.add('hidden');
    this.answerEl.inputMode = 'numeric';
    this.answerEl.placeholder = '';
  }

  private showHilbertMode(hp: HilbertProblem) {
    this.mathProblemEl.style.display = 'none';
    this.hilbertTextEl.classList.remove('hidden');
    this.hilbertTextEl.innerHTML =
      `<p>"${hp.statement}"</p>` +
      `<p style="margin-top:10px;color:#fff;font-style:normal;font-size:14px;">${hp.prompt}</p>`;
    this.answerEl.inputMode = 'text';
    this.answerEl.placeholder = '???';
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
