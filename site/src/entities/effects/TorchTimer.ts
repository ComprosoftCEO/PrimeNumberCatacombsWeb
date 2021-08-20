import { MainArea } from 'areas/MainArea';
import { TitleArea } from 'areas/TitleArea';
import { Entity, EntityState } from 'engine/entity';
import { clamp } from 'engine/helpers';
import { TorchEntity } from 'entities/layout/TorchEntity';

const STARTING_TICKS = 3 * 60 * 30; // 3 minutes
const MAX_TICKS_BRIGHTNESS = 3 * 60 * 30;
const TICKS_PER_DOOR = 5 * 30; // 5 Seconds

const LOSE_DELAY_TICKS = 5 * 30;

enum Timer {
  TickTorch,
  RestartGame,
}

/**
 * Slowly fade out the torches in the room
 */
export class TorchTimer implements EntityState {
  public readonly tags: string[] = [];

  private entity: Entity<this>;
  private currentTick = STARTING_TICKS;

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    this.entity.setTimer(Timer.TickTorch, 1, true);
  }

  /**
   * Add time back onto the clock when a door is entered
   */
  public enteredDoor(): void {
    this.currentTick += TICKS_PER_DOOR;
  }

  onDestroy(): void {}

  onDispose(): void {}

  onStep(): void {}

  onTimer(timerIndex: number): void {
    switch (timerIndex) {
      case Timer.TickTorch:
        return this.tickTorch();

      case Timer.RestartGame:
        return this.restartGame();
    }
  }

  /**
   * Happens every time the torch is ticked
   */
  private tickTorch(): void {
    const intensity = clamp(this.currentTick / MAX_TICKS_BRIGHTNESS, 0, 1);
    for (const entity of this.entity.area.findEntities('torch-entity') as Entity<TorchEntity>[]) {
      entity.state.setTorchIntensity(intensity);
    }

    // Don't lose ticks while the camera is moving
    const camera = (this.entity.area.state as MainArea).camera;
    if (!camera.isMoving) {
      this.currentTick -= 1;
      console.log(this.currentTick);
      if (this.currentTick <= 0) {
        this.entity.clearTimer(Timer.TickTorch);

        for (const entity of this.entity.area.findEntities('camera')) {
          entity.destroy();
        }

        this.entity.setTimer(Timer.RestartGame, LOSE_DELAY_TICKS, false);
      }
    }
  }

  /**
   * Called when the game should be reset
   */
  private restartGame(): void {
    const mainArea = this.entity.area.state as MainArea;
    mainArea.ambient.stop();

    this.entity.area.game.setArea(new TitleArea());
  }

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
