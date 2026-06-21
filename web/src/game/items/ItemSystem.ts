export enum ItemId {
  None = 0,
  ZestyBar = 1,
  YellowDoorLock = 2,
  Keys = 3,
  BSODA = 4,
  Quarter = 5,
  HilbertsLeastFavoriteTape = 6,
  AlarmClock = 7,
  WDNoSquee = 8,
  SafetyScissors = 9,
  BigOlBoots = 10,
  Teleporter = 11,
}

export const ITEM_NAMES: Record<number, string> = {
  [ItemId.None]: '',
  [ItemId.ZestyBar]: 'Zesty Bar',
  [ItemId.YellowDoorLock]: 'Yellow Door Lock',
  [ItemId.Keys]: 'Keys',
  [ItemId.BSODA]: 'BSODA',
  [ItemId.Quarter]: 'Quarter',
  [ItemId.HilbertsLeastFavoriteTape]: "Hilbert's Least Favorite Tape",
  [ItemId.AlarmClock]: 'Alarm Clock',
  [ItemId.WDNoSquee]: 'WD-NoSquee',
  [ItemId.SafetyScissors]: 'Safety Scissors',
  [ItemId.BigOlBoots]: "Big Ol' Boots",
  [ItemId.Teleporter]: 'A Shiny Quarter',
};

export class ItemSystem {
  slots: [number, number, number] = [0, 0, 0];
  selectedSlot = 0;

  collectItem(itemId: number): boolean {
    for (let i = 0; i < 3; i++) {
      if (this.slots[i] === 0) {
        this.slots[i] = itemId;
        return true;
      }
    }
    return false;
  }

  loseItem(slotIndex: number): number {
    const item = this.slots[slotIndex];
    this.slots[slotIndex] = 0;
    return item;
  }

  useItem(): number {
    const item = this.slots[this.selectedSlot];
    if (item !== 0) {
      this.slots[this.selectedSlot] = 0;
    }
    return item;
  }

  getCurrentItem(): number {
    return this.slots[this.selectedSlot];
  }

  hasAnyItem(): boolean {
    return this.slots.some((s) => s !== 0);
  }

  selectSlot(slot: number) {
    this.selectedSlot = Math.max(0, Math.min(2, slot));
  }

  increaseSelection() {
    this.selectedSlot = (this.selectedSlot + 1) % 3;
  }

  decreaseSelection() {
    this.selectedSlot = (this.selectedSlot + 2) % 3;
  }

  reset() {
    this.slots = [0, 0, 0];
    this.selectedSlot = 0;
  }
}
