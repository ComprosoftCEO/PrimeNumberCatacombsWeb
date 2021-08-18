import { EntityState } from 'engine/entity';

/**
 * All entities in the layout should implement this interface.
 */
export interface LayoutEntity extends EntityState {
  /// Free any resources used by the entity
  ///
  /// The resources might not be disposed until the next tick, so always wait one tick after calling this
  dispose(): void;
}

/**
 * Any entities that handle torches should implement this interface.
 */
export interface TorchEntity extends EntityState {
  /// Turn on torches at the given position
  setTorchPosition(relativePosition: number): void;

  /// Set the current torch brightness
  setTorchBrightness(brightness: number): void;
}
