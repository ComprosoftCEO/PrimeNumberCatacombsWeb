import { Area, AreaState } from 'engine/area';
import { DoorSelectorArea } from './DoorSelectorArea';
import { FadeInEffect } from 'entities/FadeInEffect';
import { MazeCamera } from 'entities/MazeCamera';
import { MazeFloor } from 'entities/MazeFloor';
import { MazeWall } from 'entities/MazeWall';

/**
 * Main area of the game
 */
export class MainArea implements AreaState, DoorSelectorArea {
  private area: Area<this>;

  private entries: string[];

  constructor(messages: string[]) {
    this.entries = messages;
  }

  public get smallestIndex(): number {
    return 0 - Math.floor((this.entries.length - 1) / 2);
  }

  public get largestIndex(): number {
    return 0 + Math.ceil((this.entries.length - 1) / 2);
  }

  onCreate(area: Area<this>): void {
    this.area = area;

    // Create the floor
    this.area.createEntity(new MazeFloor(Math.ceil(this.entries.length / 2)));

    // Create the maze walls
    for (const [index, text] of this.entries.entries()) {
      this.area.createEntity(new MazeWall(text, this.smallestIndex + index));
    }

    // Build the camera
    this.area.createEntity(new MazeCamera(0));
    this.area.createEntity(new FadeInEffect());
  }

  /**
   * Test if you can enter a door
   */
  public canEnterDoor(_index: number): boolean {
    return true;
  }

  /**
   * Action fired when a door is entered
   */
  public enterDoor(_index: number): void {
    // Clear any door resources
    for (const door of this.area.findEntities('wall')) {
      door.destroy();
    }

    this.area.setTimer(0, 1, false);
  }

  onTimer(_timerIndex: number): void {
    this.area.game.setArea(new MainArea(['-1', '0', '1']));
  }

  onStep(): void {}

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
