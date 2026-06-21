const ITEM_NAMES = [
  '',
  'Zesty Bar',
  'Yellow Door Lock',
  'Keys',
  'BSODA',
  'Quarter',
  "Hilbert's Least Favorite Tape",
  'Alarm Clock',
  'WD-NoSquee',
  'Safety Scissors',
  "Big Ol' Boots",
  'A Shiny Quarter',
];

export class HUD {
  private notebookEl: HTMLElement;
  private staminaBar: HTMLElement;
  private itemSlots: NodeListOf<Element>;
  private itemNameEl: HTMLElement;
  private warningEl: HTMLElement;
  private hudEl: HTMLElement;

  constructor() {
    this.notebookEl = document.getElementById('notebook-count')!;
    this.staminaBar = document.getElementById('stamina-bar')!;
    this.itemSlots = document.querySelectorAll('.item-slot');
    this.itemNameEl = document.getElementById('item-name')!;
    this.warningEl = document.getElementById('warning-text')!;
    this.hudEl = document.getElementById('hud')!;
  }

  show() {
    this.hudEl.classList.add('active');
  }

  hide() {
    this.hudEl.classList.remove('active');
  }

  updateNotebooks(count: number, mode: string) {
    if (mode === 'endless') {
      this.notebookEl.textContent = `Notebooks: ${count}`;
    } else {
      this.notebookEl.textContent = `Notebooks: ${count}/7`;
    }
  }

  updateStamina(current: number, max: number) {
    const pct = Math.max(0, Math.min(100, (current / max) * 100));
    this.staminaBar.style.width = `${pct}%`;

    if (pct > 50) this.staminaBar.style.background = '#0f0';
    else if (pct > 25) this.staminaBar.style.background = '#ff0';
    else this.staminaBar.style.background = '#f00';
  }

  updateItemSelection(selected: number) {
    this.itemSlots.forEach((slot, i) => {
      slot.classList.toggle('selected', i === selected);
    });
  }

  updateItemSlot(slot: number, itemId: number) {
    const el = this.itemSlots[slot] as HTMLElement;
    if (itemId === 0) {
      el.textContent = '';
      el.style.background = 'rgba(0,0,0,0.5)';
    } else {
      el.textContent = ITEM_NAMES[itemId]?.substring(0, 3) || '?';
      el.style.background = 'rgba(50,100,50,0.7)';
    }
  }

  updateItemName(itemId: number) {
    this.itemNameEl.textContent = ITEM_NAMES[itemId] || '';
  }

  showWarning(show: boolean) {
    this.warningEl.classList.toggle('hidden', !show);
  }
}
