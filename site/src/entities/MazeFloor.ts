import { Entity, EntityState } from 'engine/entity';
import * as THREE from 'three';

const PLANE_GEOMETRY = new THREE.PlaneGeometry();
const PLANE_MATERIAL = new THREE.MeshStandardMaterial();
const FLOOR_SCALE = 1 / 3;

/**
 * Represents the floor in the maze
 */
export class MazeFloor implements EntityState {
  public readonly tags: string[] = ['wall'];

  public readonly width: number;

  private entity: Entity<this>;

  /**
   * Create a new plane for the floor
   *
   * @param width Number of tiles wide
   * @param height Number of tiles high
   */
  constructor(width: number) {
    this.width = width;
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
    this.entity.object.scale.set(this.width, this.width, 1);
    this.entity.object.castShadow = true;
    this.entity.object.receiveShadow = true;
  }

  /**
   * Load a wall texture and configure texture scaling and repeating
   */
  private buildTexture(name: string): THREE.Texture {
    const texture = this.entity.area.game.assets.getTexture(name);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set((this.width * FLOOR_SCALE) / 2, (this.width * FLOOR_SCALE) / 2);
    texture.offset.set(0.5, 0.5);
    texture.rotation = Math.PI / 6;
    return texture;
  }

  onDestroy(): void {}
  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
