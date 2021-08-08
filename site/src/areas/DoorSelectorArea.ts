/**
 * Represents an "area" with a series of doors that can be selected.
 *
 * This defines a common interface to use when selecting a door,
 *  allowing the same logic to be used for menus and the gameplay.
 */
export interface DoorSelectorArea {
  readonly smallestIndex: number; // Inclusive
  readonly largestIndex: number; // Inclusive

  // Test if you can enter a door at a given index
  canEnterDoor(index: number): boolean;

  // Enter a door at a given index
  enterDoor(index: number): void;
}
