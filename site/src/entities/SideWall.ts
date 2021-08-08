import { Entity, EntityState } from 'engine/entity';
import { CAMERA_DIST_OUT, TOTAL_WIDTH, UNITS_WIDE, WALL_HEIGHT, WALL_SCALE } from './Constants';
import * as THREE from 'three';

const WALL_DEPTH = ((UNITS_WIDE - 1) / 2) * WALL_SCALE;
const WALL_OFFSET = 1.25 * WALL_SCALE;

const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const SIDE_MATERIAL = new THREE.MeshStandardMaterial();

export enum Side {
  Left,
  Right,
}

/**
 * Left wall along the main area
 */
export class SideWall implements EntityState {
  public readonly tags: string[] = ['wall'];

  private entity: Entity<this>;

  private side: Side;
  private relativePosition: number;

  constructor(side: Side, relativePosition = 0) {
    this.side = side;
    this.relativePosition = relativePosition;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    SIDE_MATERIAL.map = this.buildTexture('BrickColor');
    SIDE_MATERIAL.normalMap = this.buildTexture('BrickNormal');
    SIDE_MATERIAL.aoMap = this.buildTexture('BrickOcclusion');

    const wall: THREE.Mesh = new THREE.Mesh(BOX_GEOMETRY, SIDE_MATERIAL);
    wall.scale.set(CAMERA_DIST_OUT * 2, WALL_HEIGHT, WALL_DEPTH);
    wall.position.set(
      CAMERA_DIST_OUT / 2 + WALL_DEPTH / 2,
      WALL_HEIGHT / 2,
      this.computeSideOffset() + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object = wall;
  }

  /**
   * Dynamically build the texture to use for the side wall
   */
  private buildTexture(imageName: string): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${imageName}-Side`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const image = assets.getImage(imageName);
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set((CAMERA_DIST_OUT * 2) / WALL_SCALE, WALL_HEIGHT / WALL_SCALE);

    assets.saveTexture(textureName, texture);
    return texture;
  }

  /**
   * Compute the offset side at (0,0)
   */
  private computeSideOffset(): number {
    switch (this.side) {
      case Side.Left:
        return +WALL_OFFSET / 2 + WALL_DEPTH / 2; //(TOTAL_WIDTH / 2) - (3 * WALL_DEPTH) / 6;

      case Side.Right:
        return -WALL_OFFSET / 2 - WALL_DEPTH / 2; //(TOTAL_WIDTH / 2) + (3 * WALL_DEPTH) / 6;
    }
  }

  onDestroy(): void {}
  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
