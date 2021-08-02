import { Entity, EntityState } from 'engine/entity';
import * as THREE from 'three';

// How many tiles should one wall texture take up?
const WALL_SCALE = 8;

// Configure the size of a wall segment
//
//           Height
//    |    |        |    |
//    |    |/AHeight|    |
//    |    ||      ||    |
//    [Side][Center][Side]
//
const HEIGHT = 18;
const UNITS_WIDE = 8; /* Whole Number */

// These values are computed from the geometry
const ARCH_HEIGHT = 8.5;
const ARCH_WIDTH = 7;
const MINI_WIDTH = 1;
const MINI_HEIGHT = 1;
const SIDE_WIDTH = (UNITS_WIDE * WALL_SCALE - ARCH_WIDTH) / 2;

// Static data storage
const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const LEFT_SIDE_MATERIAL = new THREE.MeshStandardMaterial();
const RIGHT_SIDE_MATERIAL = new THREE.MeshStandardMaterial();
const TOP_BOX_MATERIAL = new THREE.MeshStandardMaterial();
const LEFT_MINI_MATERIAL = new THREE.MeshStandardMaterial();
const RIGHT_MINI_MATERIAL = new THREE.MeshStandardMaterial();
const ARCH_MATERIAL = new THREE.MeshStandardMaterial();

/**
 * Represents a wall that can be entered in the maze
 */
export class MazeWall implements EntityState {
  public readonly tags: string[] = ['wall'];

  private entity: Entity<this>;

  onCreate(entity: Entity<this>): void {
    this.entity = entity;
    this.entity.object = new THREE.Group();

    // Left Wall
    LEFT_SIDE_MATERIAL.map = this.buildLeftSideTexture('BrickColor');
    LEFT_SIDE_MATERIAL.normalMap = this.buildLeftSideTexture('BrickNormal');
    LEFT_SIDE_MATERIAL.aoMap = this.buildLeftSideTexture('BrickOcclusion');

    const leftCube = new THREE.Mesh(BOX_GEOMETRY, LEFT_SIDE_MATERIAL);
    leftCube.scale.set(1, HEIGHT, SIDE_WIDTH);
    leftCube.position.set(-0.5, HEIGHT / 2, SIDE_WIDTH / 2 + ARCH_WIDTH / 2);
    this.entity.object.add(leftCube);

    // Right Wall
    RIGHT_SIDE_MATERIAL.map = this.buildRightSideTexture('BrickColor');
    RIGHT_SIDE_MATERIAL.normalMap = this.buildRightSideTexture('BrickNormal');
    RIGHT_SIDE_MATERIAL.aoMap = this.buildRightSideTexture('BrickOcclusion');

    const rightCube = new THREE.Mesh(BOX_GEOMETRY, RIGHT_SIDE_MATERIAL);
    rightCube.scale.set(1, HEIGHT, SIDE_WIDTH);
    rightCube.position.set(-0.5, HEIGHT / 2, -SIDE_WIDTH / 2 - ARCH_WIDTH / 2);
    this.entity.object.add(rightCube);

    // Top of the arch
    TOP_BOX_MATERIAL.map = this.buildTopTexture('BrickColor');
    TOP_BOX_MATERIAL.normalMap = this.buildTopTexture('BrickNormal');
    TOP_BOX_MATERIAL.aoMap = this.buildTopTexture('BrickOcclusion');

    const topCube = new THREE.Mesh(BOX_GEOMETRY, TOP_BOX_MATERIAL);
    topCube.scale.set(1, HEIGHT - ARCH_HEIGHT, ARCH_WIDTH);
    topCube.position.set(-0.5, ARCH_HEIGHT + (HEIGHT - ARCH_HEIGHT) / 2, 0);
    this.entity.object.add(topCube);

    // Left mini cube
    LEFT_MINI_MATERIAL.map = this.buildLeftMiniTexture('BrickColor');
    LEFT_MINI_MATERIAL.normalMap = this.buildLeftMiniTexture('BrickNormal');
    LEFT_MINI_MATERIAL.aoMap = this.buildLeftMiniTexture('BrickOcclusion');

    const leftMiniCube = new THREE.Mesh(BOX_GEOMETRY, LEFT_MINI_MATERIAL);
    leftMiniCube.scale.set(1, MINI_HEIGHT, MINI_WIDTH);
    leftMiniCube.position.set(-0.5, ARCH_HEIGHT - MINI_HEIGHT / 2, (ARCH_WIDTH - MINI_WIDTH) / 2);
    this.entity.object.add(leftMiniCube);

    // Right mini cube
    RIGHT_MINI_MATERIAL.map = this.buildRightMiniTexture('BrickColor');
    RIGHT_MINI_MATERIAL.normalMap = this.buildRightMiniTexture('BrickNormal');
    RIGHT_MINI_MATERIAL.aoMap = this.buildRightMiniTexture('BrickOcclusion');

    const rightMiniCube = new THREE.Mesh(BOX_GEOMETRY, RIGHT_MINI_MATERIAL);
    rightMiniCube.scale.set(1, MINI_HEIGHT, MINI_WIDTH);
    rightMiniCube.position.set(-0.5, ARCH_HEIGHT - MINI_HEIGHT / 2, (-ARCH_WIDTH + MINI_WIDTH) / 2);
    this.entity.object.add(rightMiniCube);

    // The arch iteself
    ARCH_MATERIAL.map = this.buildArchTexture('BrickColor');
    ARCH_MATERIAL.normalMap = this.buildArchTexture('BrickNormal');
    ARCH_MATERIAL.aoMap = this.buildArchTexture('BrickOcclusion');

    const arch: THREE.Mesh = this.entity.area.game.assets.getObject('Arch').clone(false) as THREE.Mesh;
    const leftPillar: THREE.Mesh = arch.children[0] as THREE.Mesh;
    const rightPillar: THREE.Mesh = arch.children[1] as THREE.Mesh;
    arch.material = ARCH_MATERIAL;
    leftPillar.material = ARCH_MATERIAL;
    rightPillar.material = ARCH_MATERIAL;
    arch.scale.set(2, 0.5, 0.5);
    arch.position.set(0, 5.8, 0);
    this.entity.object.add(arch);
  }

  private buildLeftSideTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'LeftSide', {
      repeatX: SIDE_WIDTH / WALL_SCALE,
      repeatY: HEIGHT / WALL_SCALE,
      offsetX: 0,
      offsetY: (HEIGHT / WALL_SCALE) % 1.0,
    });
  }

  private buildRightSideTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'RightSide', {
      repeatX: SIDE_WIDTH / WALL_SCALE,
      repeatY: HEIGHT / WALL_SCALE,
      offsetX: ((SIDE_WIDTH + ARCH_WIDTH) / WALL_SCALE) % 1.0,
      offsetY: (HEIGHT / WALL_SCALE) % 1.0,
    });
  }

  private buildTopTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'Top', {
      repeatX: ARCH_WIDTH / WALL_SCALE,
      repeatY: (HEIGHT - ARCH_HEIGHT) / WALL_SCALE,
      offsetX: (SIDE_WIDTH / WALL_SCALE) % 1.0,
      offsetY: ((ARCH_HEIGHT / WALL_SCALE) % 1.0) + ((HEIGHT / WALL_SCALE) % 1.0),
    });
  }

  private buildLeftMiniTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'LeftMini', {
      repeatX: MINI_WIDTH / WALL_SCALE,
      repeatY: MINI_HEIGHT / WALL_SCALE,
      offsetX: (SIDE_WIDTH / WALL_SCALE) % 1.0,
      offsetY: ((MINI_HEIGHT / WALL_SCALE) % 1.0) + ((ARCH_HEIGHT / WALL_SCALE) % 1.0),
    });
  }

  private buildRightMiniTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'RightMini', {
      repeatX: MINI_WIDTH / WALL_SCALE,
      repeatY: MINI_HEIGHT / WALL_SCALE,
      offsetX: ((SIDE_WIDTH + ARCH_WIDTH - MINI_WIDTH) / WALL_SCALE) % 1.0,
      offsetY: ((MINI_HEIGHT / WALL_SCALE) % 1.0) + ((ARCH_HEIGHT / WALL_SCALE) % 1.0),
    });
  }

  private buildArchTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'Arch', {
      repeatX: 3 / 4,
      repeatY: 3 / 4,
    });
  }

  private dynamicallyBuildTexture(
    name: string,
    suffix: string,
    {
      repeatX,
      repeatY,
      offsetX = 0,
      offsetY = 0,
    }: { repeatX: number; repeatY: number; offsetX?: number; offsetY?: number },
  ): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${name}-${suffix}`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const image = assets.getImage(name);
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(offsetX, offsetY);

    assets.saveTexture(textureName, texture);
    return texture;
  }

  onDestroy(): void {}

  onStep(): void {}

  onTimer(timerIndex: number): void {}

  onDraw(g2d: CanvasRenderingContext2D): void {}
}
