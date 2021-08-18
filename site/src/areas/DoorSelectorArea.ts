import { AreaState } from 'engine/area';

/**
 * Represents an "area" with a series of doors that can be selected.
 *
 * This defines a common interface to use when selecting a door,
 *  allowing the same logic to be used for menus and the gameplay.
 */
export interface DoorSelectorArea extends AreaState {
  readonly smallestIndex: number; // Inclusive
  readonly largestIndex: number; // Inclusive

  /// Called whenever the camera moves to this position in the room
  ///  Also called when the camera is first constructed
  movedTo(index: number): void;

  // Test if you can enter a door at a given index
  canEnterDoor(index: number): boolean;

  // Enter a door at a given index
  enterDoor(index: number): void;
}
