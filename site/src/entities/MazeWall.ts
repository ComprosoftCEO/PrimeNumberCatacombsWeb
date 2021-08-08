import { Entity, EntityState } from 'engine/entity';
import { WALL_SCALE, UNITS_WIDE, TOTAL_WIDTH, INSIDE_DEPTH } from './Constants';
import * as THREE from 'three';

// Configure the size of a wall segment
//
//           Height
//    |    |        |    |
//    |    |/AHeight|    |
//    |    ||      ||    |
//    [Side][Center][Side]
//
const HEIGHT = 18;
const WALL_DEPTH = 1;

// These values are computed from the geometry
const ARCH_HEIGHT = 8.5;
const ARCH_WIDTH = 6.5;
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
const INSIDE_SIDE_MATERIAL = new THREE.MeshStandardMaterial();
const INSIDE_TOP_MATERIAL = new THREE.MeshStandardMaterial();
const FONT_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x705024 });

/**
 * Represents a wall that can be entered in the maze
 */
export class MazeWall implements EntityState {
  public readonly tags: string[] = ['wall'];

  private entity: Entity<this>;

  private wallText: string;
  private relativePosition: number;
  private textGeometry: THREE.TextGeometry;

  constructor(wallText: string, relativePosition = 0) {
    this.wallText = wallText;
    this.relativePosition = relativePosition;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;
    this.entity.object = new THREE.Group();

    // Build all of the materials for the walls
    MazeWall.buildMaterial(LEFT_SIDE_MATERIAL, 'Brick', this.buildLeftSideTexture.bind(this));
    MazeWall.buildMaterial(RIGHT_SIDE_MATERIAL, 'Brick', this.buildRightSideTexture.bind(this));
    MazeWall.buildMaterial(TOP_BOX_MATERIAL, 'Brick', this.buildTopTexture.bind(this));
    MazeWall.buildMaterial(LEFT_MINI_MATERIAL, 'Brick', this.buildLeftMiniTexture.bind(this));
    MazeWall.buildMaterial(RIGHT_MINI_MATERIAL, 'Brick', this.buildRightMiniTexture.bind(this));
    MazeWall.buildMaterial(ARCH_MATERIAL, 'ArchBrick', this.buildArchTexture.bind(this));
    MazeWall.buildMaterial(INSIDE_SIDE_MATERIAL, 'Brick', this.buildInsideSideTexture.bind(this));
    MazeWall.buildMaterial(INSIDE_TOP_MATERIAL, 'Brick', this.buildInsideTopTexture.bind(this));

    // Outside walls
    const leftCube = new THREE.Mesh(BOX_GEOMETRY, LEFT_SIDE_MATERIAL);
    leftCube.scale.set(WALL_DEPTH, HEIGHT, SIDE_WIDTH);
    leftCube.position.set(
      -WALL_DEPTH / 2,
      HEIGHT / 2,
      SIDE_WIDTH / 2 + ARCH_WIDTH / 2 + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(leftCube);

    const rightCube = new THREE.Mesh(BOX_GEOMETRY, RIGHT_SIDE_MATERIAL);
    rightCube.scale.set(WALL_DEPTH, HEIGHT, SIDE_WIDTH);
    rightCube.position.set(
      -WALL_DEPTH / 2,
      HEIGHT / 2,
      -SIDE_WIDTH / 2 - ARCH_WIDTH / 2 + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(rightCube);

    // Top of the arch
    const topCube = new THREE.Mesh(BOX_GEOMETRY, TOP_BOX_MATERIAL);
    topCube.scale.set(WALL_DEPTH, HEIGHT - ARCH_HEIGHT, ARCH_WIDTH);
    topCube.position.set(
      -WALL_DEPTH / 2,
      ARCH_HEIGHT + (HEIGHT - ARCH_HEIGHT) / 2,
      -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(topCube);

    // Mini boxes between the sides and top
    const leftMiniCube = new THREE.Mesh(BOX_GEOMETRY, LEFT_MINI_MATERIAL);
    leftMiniCube.scale.set(WALL_DEPTH, MINI_HEIGHT, MINI_WIDTH);
    leftMiniCube.position.set(
      -WALL_DEPTH / 2,
      ARCH_HEIGHT - MINI_HEIGHT / 2,
      (ARCH_WIDTH - MINI_WIDTH) / 2 + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(leftMiniCube);

    const rightMiniCube = new THREE.Mesh(BOX_GEOMETRY, RIGHT_MINI_MATERIAL);
    rightMiniCube.scale.set(WALL_DEPTH, MINI_HEIGHT, MINI_WIDTH);
    rightMiniCube.position.set(
      -WALL_DEPTH / 2,
      ARCH_HEIGHT - MINI_HEIGHT / 2,
      (-ARCH_WIDTH + MINI_WIDTH) / 2 + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(rightMiniCube);

    // The arch itself
    const arch: THREE.Mesh = this.entity.area.game.assets.getObject('Arch').clone(false) as THREE.Mesh;
    const leftPillar: THREE.Mesh = arch.children[0] as THREE.Mesh;
    const rightPillar: THREE.Mesh = arch.children[1] as THREE.Mesh;
    arch.material = ARCH_MATERIAL;
    leftPillar.material = ARCH_MATERIAL;
    rightPillar.material = ARCH_MATERIAL;
    arch.scale.set(WALL_DEPTH * 2, 0.5, 0.5);
    arch.position.set(0, 5.8, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(arch);

    // Tunnel inside of the arch
    const leftInsideWall: THREE.Mesh = new THREE.Mesh(BOX_GEOMETRY, INSIDE_SIDE_MATERIAL);
    leftInsideWall.scale.set(INSIDE_DEPTH - WALL_DEPTH, ARCH_HEIGHT, WALL_DEPTH);
    leftInsideWall.position.set(
      -WALL_DEPTH / 2 - (INSIDE_DEPTH - WALL_DEPTH) / 2,
      ARCH_HEIGHT / 2,
      ARCH_WIDTH / 2 + WALL_DEPTH / 2 + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(leftInsideWall);

    const rightInsideWall: THREE.Mesh = new THREE.Mesh(BOX_GEOMETRY, INSIDE_SIDE_MATERIAL);
    rightInsideWall.scale.set(INSIDE_DEPTH - WALL_DEPTH, ARCH_HEIGHT, WALL_DEPTH);
    rightInsideWall.position.set(
      -WALL_DEPTH / 2 - (INSIDE_DEPTH - WALL_DEPTH) / 2,
      ARCH_HEIGHT / 2,
      -ARCH_WIDTH / 2 - WALL_DEPTH / 2 + -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(rightInsideWall);

    const topInsideWall: THREE.Mesh = new THREE.Mesh(BOX_GEOMETRY, INSIDE_TOP_MATERIAL);
    topInsideWall.scale.set(INSIDE_DEPTH - WALL_DEPTH, WALL_DEPTH, ARCH_WIDTH);
    topInsideWall.position.set(
      -WALL_DEPTH / 2 - (INSIDE_DEPTH - WALL_DEPTH) / 2,
      ARCH_HEIGHT + WALL_DEPTH / 2,
      -this.relativePosition * TOTAL_WIDTH,
    );
    this.entity.object.add(topInsideWall);

    // Torches
    const leftTorch: THREE.Object3D = this.entity.area.game.assets.getObject('WallTorch').clone(false);
    leftTorch.scale.set(0.5, 1, 0.5);
    leftTorch.position.set(WALL_DEPTH, 4.4, 3.175 + -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(leftTorch);

    const rightTorch: THREE.Object3D = this.entity.area.game.assets.getObject('WallTorch').clone(false);
    rightTorch.scale.set(0.5, 1, 0.5);
    rightTorch.position.set(WALL_DEPTH, 4.4, -3.175 + -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(rightTorch);

    // Torch Lights
    const leftTorchLight: THREE.Object3D = new THREE.PointLight(0xffd050, 1, 13, 1);
    leftTorchLight.position.set(WALL_DEPTH + 0.3, 5.3, 3.175 + -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(leftTorchLight);

    const rightTorchLight: THREE.Object3D = leftTorchLight.clone();
    rightTorchLight.position.set(WALL_DEPTH + 0.3, 5.3, -3.175 + -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(rightTorchLight);

    // 3D Text
    this.textGeometry = new THREE.TextGeometry(this.wallText, {
      font: this.entity.area.game.assets.getFont('Number'),
      size: 0.7,
      height: 1,
    });
    this.textGeometry.computeBoundingBox();
    const boundingBox = this.textGeometry.boundingBox;
    const textWidth = boundingBox.max.x - boundingBox.min.x;
    const textHeight = boundingBox.max.y - boundingBox.min.y;

    const textMesh = new THREE.Mesh(this.textGeometry, FONT_MATERIAL);
    textMesh.rotation.set(0, Math.PI / 2, 0);
    textMesh.position.set(-0.8, ARCH_HEIGHT + 2 * textHeight, textWidth / 2 + -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(textMesh);
  }

  private static buildMaterial(
    material: THREE.MeshStandardMaterial,
    prefix: string,
    buildTexture: (name: string) => THREE.Texture,
  ) {
    material.map = buildTexture(`${prefix}Color`);
    material.normalMap = buildTexture(`${prefix}Normal`);
    material.aoMap = buildTexture(`${prefix}Occlusion`);
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

  private buildInsideSideTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'InsideSide', {
      repeatX: (INSIDE_DEPTH - WALL_DEPTH) / WALL_SCALE,
      repeatY: ARCH_HEIGHT / WALL_SCALE,
    });
  }

  private buildInsideTopTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'InsideTop', {
      repeatX: (INSIDE_DEPTH - WALL_DEPTH) / WALL_SCALE,
      repeatY: ARCH_WIDTH / WALL_SCALE,
    });
  }

  /**
   * Create and save a texture inside the resources with the given repeats and offsets
   *
   * @param imageName Name of the image to load
   * @param suffix Suffix to uniquely identify the texture
   */
  private dynamicallyBuildTexture(
    imageName: string,
    suffix: string,
    {
      repeatX,
      repeatY,
      offsetX = 0,
      offsetY = 0,
    }: { repeatX: number; repeatY: number; offsetX?: number; offsetY?: number },
  ): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${imageName}-${suffix}`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const image = assets.getImage(imageName);
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.offset.set(offsetX, offsetY);

    assets.saveTexture(textureName, texture);
    return texture;
  }

  onDestroy(): void {
    this.textGeometry.dispose();
  }

  onStep(): void {}

  onTimer(_timerIndex: number): void {}

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
