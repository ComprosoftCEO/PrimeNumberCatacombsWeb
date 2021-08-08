import { Area, AreaState } from 'engine/area';
import { DoorSelectorArea } from './DoorSelectorArea';
import { FadeInEffect } from 'entities/FadeInEffect';
import { MazeCamera } from 'entities/MazeCamera';
import { MazeFloor } from 'entities/MazeFloor';
import { MazeWall } from 'entities/MazeWall';
import { computeCatacombs } from 'prime-number-catacombs';

interface CatacombNumber {
  value: string;
  isPrime: boolean;
}

/**
 * Main area of the game
 */
export class MainArea implements AreaState, DoorSelectorArea {
  private area: Area<this>;

  private entries: string[];

  /**
   * Construct a new game area
   *
   * @param currentNumber Base-10 representation of the prime number
   */
  constructor(currentNumber: string) {
    const catacombNumbers: CatacombNumber[] = computeCatacombs(currentNumber);
    this.entries = catacombNumbers.filter(({ isPrime }) => isPrime).map(({ value }) => value);
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
  public enterDoor(index: number): void {
    // Clear any door resources
    for (const door of this.area.findEntities('wall')) {
      door.destroy();
    }

    // Hacky: use the timer index to specify the next room to visit
    this.area.setTimer(index - this.smallestIndex, 1, false);
  }

  onTimer(timerIndex: number): void {
    this.area.game.setArea(new MainArea(this.entries[timerIndex]));
  }

  onStep(): void {}

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
