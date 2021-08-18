import { Area, AreaState } from 'engine/area';
import { Entity } from 'engine/entity';
import { AudioWrapper } from 'engine/audio';
import { MouseButton } from 'engine/input';
import { computeCatacombs } from 'prime-number-catacombs';
import { DoorSelectorArea } from './DoorSelectorArea';
import { FadeInEffect } from 'entities/effects/FadeInEffect';
import { MazeCamera } from 'entities/MazeCamera';
import { MazeFloor } from 'entities/layout/MazeFloor';
import { ArchGroup, ArchProps } from 'entities/layout/ArchGroup';
import { BlankWall } from 'entities/unused/BlankWall';
import { Side, SideWall } from 'entities/layout/SideWall';
import { LayoutEntity, TorchEntity } from 'entities/layout/LayoutEntity';
import * as seededRandom from 'seedrandom';
import { randomInt, shuffleArray } from 'engine/helpers';
import { BlankWallGroup, BlankWallProps } from 'entities/layout/BlankWallGroup';
import { Graffiti } from 'entities/layout/Graffiti';

interface CatacombNumber {
  value: string;
  isPrime: boolean;
}

type Entry = ArchEntry | BlankWallEntry;

interface ArchEntry {
  isArchway: true;
  catacombNumber: CatacombNumber;
}

interface BlankWallEntry {
  isArchway: false;
  showGraffiti: boolean;
}

const GRAFFITI_PROBABILITY = 0.6;

/**
 * Main area of the game
 */
export class MainArea implements AreaState, DoorSelectorArea {
  private area: Area<this>;

  private catacombNumber: CatacombNumber;
  private base: number;
  private allowComposite: boolean;

  private entries: Entry[];
  private ambient: AudioWrapper;

  /**
   * Construct a new game area
   *
   * @param currentNumber Base-10 representation of the prime number
   * @param base Which base to use for the numbering system (2 to 36), default is binary (2)
   * @param allowComposite If true, then composite numbers are shown in the room
   */
  constructor(currentNumber: string, base = 2, allowComposite = false) {
    this.catacombNumber = {
      value: currentNumber,

      /* Hacky: starting number is always considered prime */
      isPrime: true,
    };
    this.base = base;
    this.allowComposite = allowComposite;
  }

  public get smallestIndex(): number {
    return 0 - Math.floor(Math.max(this.entries.length - 1, 0) / 2);
  }

  public get largestIndex(): number {
    return 0 + Math.ceil(Math.max(this.entries.length - 1, 0) / 2);
  }

  onCreate(area: Area<this>): void {
    this.area = area;

    // Initialize the room
    this.computeEntries();
    this.buildArea();

    // Start the creepy ambient noise
    this.ambient = this.area.createAudio('Ambient');
    this.ambient.play(true);
  }

  /**
   * Use the seeded PRNG to compute the entries for the area
   */
  private computeEntries(): void {
    // Special case: composite numbers end the game
    if (!this.catacombNumber.isPrime) {
      this.entries = []; // Trap the player
      return;
    }

    const prng = seededRandom(`${this.catacombNumber.value}-Entries`);

    // Generate the prime (and possibly composite) archways
    const catacombNumbers: CatacombNumber[] = computeCatacombs(this.catacombNumber.value, this.base);
    const archways: ArchEntry[] = catacombNumbers
      .filter(({ isPrime, value }) => (this.allowComposite ? value !== '0' : isPrime))
      .map((catacombNumber) => ({ isArchway: true, catacombNumber }));

    // Special case: no archways ends the game
    if (catacombNumbers.length === 0) {
      this.entries = []; // Trap the player
      return;
    }

    // Generate additional "blank" walls to show, and randomly add graffiti to them
    const numWalls = randomInt(0, Math.ceil(archways.length / 2), prng);
    const blankWallEntries: BlankWallEntry[] = new Array(numWalls).fill(null).map(() => ({
      isArchway: false,
      showGraffiti: prng() < GRAFFITI_PROBABILITY,
    }));

    // Shuffle the order based on the seed
    this.entries = shuffleArray([...archways, ...blankWallEntries], false, prng);
  }

  /**
   * Build all of the objects inside the area
   */
  private buildArea(): void {
    const allEntries = this.entries.map((entry, index) => ({
      text: entry.isArchway ? entry.catacombNumber.value : undefined,
      relativePosition: this.smallestIndex + index,
      showGraffiti: entry.isArchway === false ? entry.showGraffiti : undefined,
    }));

    // Create the floor
    this.area.createEntity(new MazeFloor(Math.ceil(this.entries.length / 2)));

    // Create the maze archways
    const archEntries: ArchProps[] = allEntries.filter(({ text }) => typeof text !== 'undefined');
    if (archEntries.length > 0) {
      this.area.createEntity(new ArchGroup(archEntries));
    }

    // Create the blank walls
    const blankWallEntries: BlankWallProps[] = allEntries.filter(({ text }) => typeof text === 'undefined');
    if (blankWallEntries.length > 0) {
      this.area.createEntity(new BlankWallGroup(blankWallEntries));
    }

    // Add all of the graffiti walls
    for (const [index, { relativePosition }] of allEntries.filter(({ showGraffiti }) => showGraffiti).entries()) {
      this.area.createEntity(new Graffiti(relativePosition, index));
    }

    // Add a blank wall if there are no numbers
    if (this.entries.length === 0) {
      this.area.createEntity(new BlankWallGroup([{ relativePosition: 0 }]));
    }

    // Left and right side walls
    this.area.createEntity(new SideWall(Side.Left, this.smallestIndex));
    this.area.createEntity(new SideWall(Side.Right, this.largestIndex));

    // Build the camera, start in a random location
    const prng = seededRandom(`${this.catacombNumber.value}-Start`);
    this.area.createEntity(new MazeCamera(randomInt(this.smallestIndex, this.largestIndex, prng)));

    // Fade-in effect
    this.area.createEntity(new FadeInEffect());
  }

  /**
   * Called when the camera moves to this index in the room
   */
  public movedTo(index: number): void {
    for (const entity of this.area.findEntities('torch-entity') as Entity<TorchEntity>[]) {
      entity.state.setTorchPosition(index);
    }
  }

  /**
   * Test if you can enter a door
   */
  public canEnterDoor(index: number): boolean {
    const entry = this.entries[index - this.smallestIndex];
    return typeof entry !== 'undefined' && entry.isArchway;
  }

  /**
   * Action fired when a door is entered
   */
  public enterDoor(index: number): void {
    this.clearArea();

    // Hacky: use the timer index to specify the next room to visit
    this.area.setTimer(index - this.smallestIndex, 1, false);
  }

  /**
   * Clear all of the objects inside the area
   */
  private clearArea(): void {
    // Clear any room resources
    for (const object of this.area.findEntities('layout-entity') as Entity<LayoutEntity>[]) {
      object.state.dispose();
    }

    // Destroy the camera
    for (const camera of this.area.findEntities('camera')) {
      camera.destroy();
    }
  }

  onTimer(timerIndex: number): void {
    // Go to the next room
    const entry = this.entries[timerIndex];
    if (typeof entry !== 'undefined' && entry.isArchway) {
      this.catacombNumber = entry.catacombNumber;
    } else {
      // Should not happen! If it does, then trap the player...
      this.catacombNumber.isPrime = false;
    }

    this.computeEntries();
    this.buildArea();
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
