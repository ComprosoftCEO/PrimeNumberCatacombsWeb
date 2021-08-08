import { Area, AreaState } from 'engine/area';
import { FadeInEffect } from 'entities/FadeInEffect';
import { MazeCamera } from 'entities/MazeCamera';
import { MazeFloor } from 'entities/MazeFloor';
import { MazeWall } from 'entities/MazeWall';
import * as THREE from 'three';

/**
 * Main area of the game
 */
export class MainArea implements AreaState {
  private area: Area<this>;

  constructor(private messages: string[]) {}

  onCreate(area: Area<this>): void {
    this.area = area;

    // Create the floor
    this.area.createEntity(new MazeFloor(6));
    this.area.createEntity(new MazeWall('0123456789'));
    this.area.createEntity(new MazeWall('Left', -1));
    this.area.createEntity(new MazeWall('Right', +1));

    // Build the camera
    this.area.createEntity(new MazeCamera(0));
    this.area.createEntity(new FadeInEffect());
  }

  onTimer(_timerIndex: number): void {}

  onStep(): void {}

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
