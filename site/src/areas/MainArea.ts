import { Area, AreaState } from 'engine/area';
import { AudioWrapper } from 'engine/audio';
import { MouseButton } from 'engine/input';
import { computeCatacombs } from 'prime-number-catacombs';
import { DoorSelectorArea } from './DoorSelectorArea';
import { FadeInEffect } from 'entities/FadeInEffect';
import { MazeCamera } from 'entities/MazeCamera';
import { MazeFloor } from 'entities/MazeFloor';
import { MazeWall } from 'entities/MazeWall';
import { Side, SideWall } from 'entities/SideWall';
import { BlankWall } from 'entities/BlankWall';

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

  private ambient: AudioWrapper;

  /**
   * Construct a new game area
   *
   * @param currentNumber Base-10 representation of the prime number
   */
  constructor(currentNumber: string) {
    const catacombNumbers: CatacombNumber[] = computeCatacombs(currentNumber, 2);
    this.entries = catacombNumbers.filter(({ isPrime }) => isPrime).map(({ value }) => value);
  }

  public get smallestIndex(): number {
    return 0 - Math.floor(Math.max(this.entries.length - 1, 0) / 2);
  }

  public get largestIndex(): number {
    return 0 + Math.ceil(Math.max(this.entries.length - 1, 0) / 2);
  }

  onCreate(area: Area<this>): void {
    this.area = area;

    // Create the floor
    this.area.createEntity(new MazeFloor(Math.ceil(this.entries.length / 2)));

    // Create the maze walls
    for (const [index, text] of this.entries.entries()) {
      this.area.createEntity(new MazeWall(text, this.smallestIndex + index));
    }
    if (this.entries.length === 0) {
      this.area.createEntity(new BlankWall());
    }

    this.area.createEntity(new SideWall(Side.Left, this.smallestIndex));
    this.area.createEntity(new SideWall(Side.Right, this.largestIndex));

    // Build the camera
    this.area.createEntity(new MazeCamera(0));
    this.area.createEntity(new FadeInEffect());

    // Start the creepy ambient noise
    this.ambient = this.area.createAudio('Ambient');
    if (!this.ambient.isPlaying) {
      this.ambient.play(true);
    }
  }

  /**
   * Test if you can enter a door
   */
  public canEnterDoor(index: number): boolean {
    return typeof this.entries[index - this.smallestIndex] !== 'undefined';
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

  onStep(): void {
    // Fix for audio playing
    const input = this.area.game.input;
    if (input.isMouseButtonDown(MouseButton.Left)) {
      this.ambient.audio.context.resume();
    }
  }

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
