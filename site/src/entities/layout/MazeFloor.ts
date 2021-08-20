import { Entity, EntityState } from 'engine/entity';
import { INSIDE_DEPTH, TOTAL_WIDTH } from '../Constants';
import * as THREE from 'three';

const PLANE_GEOMETRY = new THREE.PlaneGeometry();
const PLANE_MATERIAL = new THREE.MeshStandardMaterial();
const FLOOR_SCALE = 6;

/**
 * Represents the floor in the maze
 */
export class MazeFloor implements EntityState {
  public readonly tags: string[] = ['layout-entity'];

  private entity: Entity<this>;
  private readonly width: number;

  /**
   * Create a new plane for the floor
   *
   * @param unitsPerSide Number of unit collections wide on each side
   */
  constructor(unitsPerSide = 0) {
    this.width = 2 * unitsPerSide * TOTAL_WIDTH + TOTAL_WIDTH;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    // Load and initialize the texture
    PLANE_MATERIAL.map = this.buildTexture('DirtColor');
    PLANE_MATERIAL.normalMap = this.buildTexture('DirtNormal');
    PLANE_MATERIAL.aoMap = this.buildTexture('DirtOcclusion');

    // Build the plane object
    this.entity.object = new THREE.Mesh(PLANE_GEOMETRY, PLANE_MATERIAL);
    this.entity.object.position.y = 0.01;
    this.entity.object.rotation.x = (3 * Math.PI) / 2;
    this.entity.object.scale.set(2 * INSIDE_DEPTH, this.width, 1);
  }

  /**
   * Load a wall texture and configure texture scaling and repeating
   */
  private buildTexture(name: string): THREE.Texture {
    const texture = this.entity.area.game.assets.getTexture(name);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set((2 * INSIDE_DEPTH) / FLOOR_SCALE, this.width / FLOOR_SCALE);
    texture.offset.set(0.5, 0.5);
    return texture;
  }

  onDestroy(): void {}
  onDispose(): void {}
  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
