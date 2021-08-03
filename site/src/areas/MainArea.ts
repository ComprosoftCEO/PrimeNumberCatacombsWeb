import { Area, AreaState } from 'engine/area';
import { MazeFloor } from 'entities/MazeFloor';
import { MazeWall } from 'entities/MazeWall';
import * as THREE from 'three';

/**
 * Main area of the game
 */
export class MainArea implements AreaState {
  private area: Area<this>;
  private camera: THREE.PerspectiveCamera;

  constructor(private messages: string[]) {}

  onCreate(area: Area<this>): void {
    this.area = area;

    // Create the floor
    this.area.createEntity(new MazeFloor(10000));

    this.area.createEntity(new MazeWall());

    // Add a static light and enable shadows
    area.scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    area.game.renderer.shadowMap.enabled = true;

    // Build the camera
    this.area.game.input.pointerLockEnabled = false;
    this.camera = new THREE.PerspectiveCamera(50, area.game.canvasWidth / area.game.canvasHeight, 0.001, 1000);
    this.area.camera = this.camera;

    // Set the camera position in the maze
    this.camera.position.set(15, 4.3, 0);
    this.camera.rotateY(Math.PI / 2);
  }

  onTimer(_timerIndex: number): void {}

  onStep(): void {
    // Make sure the camera is scaled properly
    this.camera.aspect = this.area.game.canvasWidth / this.area.game.canvasHeight;
    this.camera.updateProjectionMatrix();
  }

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
