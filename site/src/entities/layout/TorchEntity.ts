import { EntityState } from 'engine/entity';

/**
 * Any entities that handle torches should implement this interface.
 */
export interface TorchEntity extends EntityState {
  /// Turn on torches at the given position
  setTorchPosition(relativePosition: number): void;

  /// Set the current torch intensity (0.0 to 1.0)
  setTorchIntensity(intensity: number): void;
}
