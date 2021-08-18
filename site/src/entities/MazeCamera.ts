import { Entity, EntityState } from 'engine/entity';
import { Key } from 'engine/input';
import { TOTAL_WIDTH, INSIDE_DEPTH, CAMERA_DIST_OUT } from './Constants';
import { DoorSelectorArea } from 'areas/DoorSelectorArea';
import * as THREE from 'three';

const MOVEMENT_DELAY_TICKS = 10;

// Speed to move left and right
const MOVING_SPEED_TICKS = 40;
const MOVEMENT_SPEED = TOTAL_WIDTH / MOVING_SPEED_TICKS;

// Speed to zoom in
const ZOOM_SPEED_TICKS = 80;
const ZOOM_DISTANCE = INSIDE_DEPTH / 2 + CAMERA_DIST_OUT;
const ZOOM_SPEED = ZOOM_DISTANCE / ZOOM_SPEED_TICKS;

enum Timer {
  ClearMovementDelay,
  MoveLeft,
  MoveRight,
  ZoomIn,
}

/**
 * Camera that moves left and right in the maze
 */
export class MazeCamera implements EntityState {
  public readonly tags: string[] = ['camera'];

  private entity: Entity<this>;
  private camera: THREE.PerspectiveCamera;

  private relativePosition: number;
  private movingTick = 1;

  constructor(relativePosition = 0) {
    this.relativePosition = relativePosition;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    // Build the camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      this.entity.area.game.canvasWidth / this.entity.area.game.canvasHeight,
      0.001,
      1000,
    );
    this.camera.position.set(CAMERA_DIST_OUT, 4.8, this.relativePosition * TOTAL_WIDTH);
    this.camera.rotateY(Math.PI / 2);
    this.entity.area.camera = this.camera;
    this.entity.object = this.camera;

    // Add a bit of movement delay for when the room first loads
    this.entity.setTimer(Timer.ClearMovementDelay, MOVEMENT_DELAY_TICKS, false);

    // Indicate the starting position of the camera
    this.doorSelector.movedTo(this.relativePosition);
  }

  onDestroy(): void {}

  onStep(): void {
    // Make sure the camera is scaled properly
    this.camera.aspect = this.entity.area.game.canvasWidth / this.entity.area.game.canvasHeight;
    this.camera.updateProjectionMatrix();

    // Handle user input
    const input = this.entity.area.game.input;
    const doorSelector = this.doorSelector;
    if (!this.isMoving) {
      if (input.isKeyStarted(Key.Left) && this.relativePosition > doorSelector.smallestIndex) {
        this.moveLeft();
      } else if (input.isKeyStarted(Key.Right) && this.relativePosition < doorSelector.largestIndex) {
        this.moveRight();
      } else if (input.isKeyStarted(Key.Up) && doorSelector.canEnterDoor(this.relativePosition)) {
        this.zoomIn();
      }
    }
  }

  // Cast the current area into the DoorSelectorArea interface
  private get doorSelector(): DoorSelectorArea {
    return this.entity.area.state as DoorSelectorArea;
  }

  // Test if the camera is currently moving
  private get isMoving(): boolean {
    return this.movingTick !== 0;
  }

  // Start animation to move the camera one position left
  private moveLeft() {
    this.movingTick = 1;
    this.entity.setTimer(Timer.MoveLeft, 1, true);
  }

  // Start animation to move the camera one position right
  private moveRight() {
    this.movingTick = 1;
    this.entity.setTimer(Timer.MoveRight, 1, true);
  }

  // Start animation to zoom the camera in to the door
  private zoomIn() {
    this.movingTick = 1;
    this.entity.setTimer(Timer.ZoomIn, 1, true);
  }

  /**
   * On Timer
   */
  onTimer(timerIndex: number): void {
    switch (timerIndex) {
      case Timer.ClearMovementDelay:
        return this.clearMovementDelay();

      case Timer.MoveLeft:
        return this.moveCameraLeftTick();

      case Timer.MoveRight:
        return this.moveCameraRightTick();

      case Timer.ZoomIn:
        return this.zoomInTick();
    }
  }

  // Allow movement
  private clearMovementDelay() {
    this.movingTick = 0;
  }

  // Single tick for moving the camera left animation
  private moveCameraLeftTick() {
    this.camera.position.z += MOVEMENT_SPEED;
    this.movingTick += 1;

    if (this.movingTick > MOVING_SPEED_TICKS) {
      this.relativePosition -= 1;
      this.movingTick = 0;
      this.entity.clearTimer(Timer.MoveLeft);

      this.doorSelector.movedTo(this.relativePosition);
    }
  }

  // Single tick for moving the camera right animation
  private moveCameraRightTick() {
    this.camera.position.z -= MOVEMENT_SPEED;
    this.movingTick += 1;

    if (this.movingTick > MOVING_SPEED_TICKS) {
      this.relativePosition += 1;
      this.movingTick = 0;
      this.entity.clearTimer(Timer.MoveRight);

      this.doorSelector.movedTo(this.relativePosition);
    }
  }

  // Single tick for zooming the camera in
  private zoomInTick() {
    this.camera.position.x -= ZOOM_SPEED;
    this.movingTick += 1;

    if (this.movingTick > ZOOM_SPEED_TICKS) {
      this.movingTick = 0;
      this.entity.clearTimer(Timer.ZoomIn);

      this.doorSelector.enterDoor(this.relativePosition);
    }
  }

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
