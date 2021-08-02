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
const HEIGHT = 30;
const ARCH_HEIGHT = 8.5;
const SIDE_WIDTH = 15.5;
const ARCH_WIDTH = 7;

const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const SIDE_BOX_MATERIAL = new THREE.MeshStandardMaterial();
const TOP_BOX_MATERIAL = new THREE.MeshStandardMaterial();
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

    // Load and initialize the textures
    SIDE_BOX_MATERIAL.map = this.buildSideTexture('BrickColor');
    SIDE_BOX_MATERIAL.normalMap = this.buildSideTexture('BrickNormal');
    SIDE_BOX_MATERIAL.aoMap = this.buildSideTexture('BrickOcclusion');

    const leftCube = new THREE.Mesh(BOX_GEOMETRY, SIDE_BOX_MATERIAL);
    leftCube.scale.set(1, HEIGHT, SIDE_WIDTH);
    leftCube.position.set(-0.5, HEIGHT / 2, SIDE_WIDTH / 2 + ARCH_WIDTH / 2);
    this.entity.object.add(leftCube);

    const rightCube = new THREE.Mesh(BOX_GEOMETRY, SIDE_BOX_MATERIAL);
    rightCube.scale.set(1, HEIGHT, SIDE_WIDTH);
    rightCube.position.set(-0.5, HEIGHT / 2, -SIDE_WIDTH / 2 - ARCH_WIDTH / 2);
    this.entity.object.add(rightCube);

    TOP_BOX_MATERIAL.map = this.buildTopTexture('BrickColor');
    TOP_BOX_MATERIAL.normalMap = this.buildTopTexture('BrickNormal');
    TOP_BOX_MATERIAL.aoMap = this.buildTopTexture('BrickOcclusion');

    const topCube = new THREE.Mesh(BOX_GEOMETRY, TOP_BOX_MATERIAL);
    topCube.scale.set(1, HEIGHT - ARCH_HEIGHT, ARCH_WIDTH);
    topCube.position.set(-0.5, ARCH_HEIGHT + (HEIGHT - ARCH_HEIGHT) / 2, 0);
    this.entity.object.add(topCube);

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

  /**
   * Load a wall texture and configure texture scaling and repeating
   */
  private buildSideTexture(name: string): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${name}-Side`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const image = assets.getImage(name);
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(SIDE_WIDTH / WALL_SCALE, HEIGHT / WALL_SCALE);
    texture.offset.set(-(((SIDE_WIDTH + ARCH_WIDTH / 2) / WALL_SCALE) % 1.0), -((HEIGHT / WALL_SCALE) % 1.0));

    assets.saveTexture(textureName, texture);
    return texture;
  }

  /**
   * Load a wall texture and configure texture scaling and repeating
   */
  private buildTopTexture(name: string): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${name}-Top`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const image = assets.getImage(name);
    const texture = new THREE.Texture(image);
    const repeatY = (HEIGHT - ARCH_HEIGHT) / WALL_SCALE;
    const height = HEIGHT - ARCH_HEIGHT;

    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(ARCH_WIDTH / WALL_SCALE, repeatY);
    texture.offset.set(-(ARCH_WIDTH / WALL_SCALE) % 1.0, (ARCH_HEIGHT / WALL_SCALE) % 1.0);

    assets.saveTexture(textureName, texture);
    return texture;
  }

  /**
   * Load a wall texture and configure texture scaling and repeating
   */
  private buildArchTexture(name: string): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${name}-Arch`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const texture = new THREE.Texture(assets.getImage(name));
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(3 / 4, 3 / 4);

    assets.saveTexture(textureName, texture);
    return texture;
  }

  onDestroy(): void {}

  onStep(): void {}

  onTimer(timerIndex: number): void {}

  onDraw(g2d: CanvasRenderingContext2D): void {}
}
