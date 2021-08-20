import { Entity, EntityState } from 'engine/entity';
import { WALL_SCALE, UNITS_WIDE, TOTAL_WIDTH, WALL_HEIGHT, WALL_DEPTH, INSIDE_DEPTH } from '../Constants';
import { TorchEntity } from './TorchEntity';
import * as THREE from 'three';

/// Defines how a single archway looks
export interface ArchProps {
  text?: string;
  relativePosition: number;
}

// These values are computed from the geometry
const ARCH_HEIGHT = 8.5;
const ARCH_WIDTH = 6.5;
const MINI_WIDTH = 1;
const MINI_HEIGHT = 1;
const SIDE_WIDTH = (UNITS_WIDE * WALL_SCALE - ARCH_WIDTH) / 2;

// Static data storage
const PLANE_GEOMETRY = new THREE.PlaneGeometry();
const LEFT_SIDE_MATERIAL = new THREE.MeshStandardMaterial();
const RIGHT_SIDE_MATERIAL = new THREE.MeshStandardMaterial();
const TOP_WALL_MATERIAL = new THREE.MeshStandardMaterial();
const LEFT_MINI_MATERIAL = new THREE.MeshStandardMaterial();
const RIGHT_MINI_MATERIAL = new THREE.MeshStandardMaterial();
const ARCH_MATERIAL = new THREE.MeshStandardMaterial();
const INSIDE_SIDE_MATERIAL = new THREE.MeshStandardMaterial();
const INSIDE_TOP_MATERIAL = new THREE.MeshStandardMaterial();
const TORCH_MATERIAL = new THREE.MeshStandardMaterial();
const FONT_MATERIAL = new THREE.MeshStandardMaterial({ color: 0x705024 });

/**
 * Group of arches in the maze.
 *
 * Be sure to destroy this entity before moving to another room, or there will be a memory leak!
 */
export class ArchGroup implements EntityState, TorchEntity {
  public readonly tags: string[] = ['layout-entity', 'torch-entity'];

  private entity: Entity<this>;
  private entries: ArchProps[];

  // Resources that must be freed
  private leftSideWall: THREE.InstancedMesh;
  private rightSideWall: THREE.InstancedMesh;
  private topWall: THREE.InstancedMesh;
  private leftMiniCube: THREE.InstancedMesh;
  private rightMiniCube: THREE.InstancedMesh;
  private arch: THREE.InstancedMesh;
  private leftInsideWall: THREE.InstancedMesh;
  private rightInsideWall: THREE.InstancedMesh;
  private topInsideWall: THREE.InstancedMesh;
  private torch: THREE.InstancedMesh;
  private textGeometry: THREE.TextGeometry[];

  // Lights for dimming
  private torchLights: Map<number, THREE.PointLight[]>;

  constructor(entries: ArchProps[]) {
    this.entries = entries;
    this.torchLights = new Map(entries.map(({ relativePosition }) => [relativePosition, []]));
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;
    this.entity.object = new THREE.Group();

    // Build all of the materials for the walls
    ArchGroup.buildMaterial(LEFT_SIDE_MATERIAL, 'Brick', this.buildLeftSideTexture.bind(this));
    ArchGroup.buildMaterial(RIGHT_SIDE_MATERIAL, 'Brick', this.buildRightSideTexture.bind(this));
    ArchGroup.buildMaterial(TOP_WALL_MATERIAL, 'Brick', this.buildTopTexture.bind(this));
    ArchGroup.buildMaterial(LEFT_MINI_MATERIAL, 'Brick', this.buildLeftMiniTexture.bind(this));
    ArchGroup.buildMaterial(RIGHT_MINI_MATERIAL, 'Brick', this.buildRightMiniTexture.bind(this));
    ArchGroup.buildMaterial(ARCH_MATERIAL, 'ArchBrick', this.buildArchTexture.bind(this));
    ArchGroup.buildMaterial(INSIDE_SIDE_MATERIAL, 'Brick', this.buildInsideSideTexture.bind(this));
    ArchGroup.buildMaterial(INSIDE_TOP_MATERIAL, 'Brick', this.buildInsideTopTexture.bind(this));

    // Create all of the instanced meshes
    this.leftSideWall = new THREE.InstancedMesh(PLANE_GEOMETRY, LEFT_SIDE_MATERIAL, this.entries.length);
    this.rightSideWall = new THREE.InstancedMesh(PLANE_GEOMETRY, RIGHT_SIDE_MATERIAL, this.entries.length);
    this.topWall = new THREE.InstancedMesh(PLANE_GEOMETRY, TOP_WALL_MATERIAL, this.entries.length);
    this.leftMiniCube = new THREE.InstancedMesh(PLANE_GEOMETRY, LEFT_MINI_MATERIAL, this.entries.length);
    this.rightMiniCube = new THREE.InstancedMesh(PLANE_GEOMETRY, RIGHT_MINI_MATERIAL, this.entries.length);

    const archObject: THREE.Mesh = this.entity.area.game.assets.getObject('Arch') as THREE.Mesh;
    this.arch = new THREE.InstancedMesh(archObject.geometry, ARCH_MATERIAL, this.entries.length);

    this.leftInsideWall = new THREE.InstancedMesh(PLANE_GEOMETRY, INSIDE_SIDE_MATERIAL, this.entries.length);
    this.rightInsideWall = new THREE.InstancedMesh(PLANE_GEOMETRY, INSIDE_SIDE_MATERIAL, this.entries.length);
    this.topInsideWall = new THREE.InstancedMesh(PLANE_GEOMETRY, INSIDE_TOP_MATERIAL, this.entries.length);

    const torch: THREE.Mesh = this.entity.area.game.assets.getObject('WallTorch') as THREE.Mesh;
    TORCH_MATERIAL.copy(torch.material as THREE.MeshStandardMaterial);
    this.torch = new THREE.InstancedMesh(torch.geometry, TORCH_MATERIAL, this.entries.length * 2);

    this.entity.object.add(
      this.leftSideWall,
      this.rightSideWall,
      this.topWall,
      this.leftMiniCube,
      this.rightMiniCube,
      this.arch,
      this.leftInsideWall,
      this.rightInsideWall,
      this.topInsideWall,
      this.torch,
    );

    // Build the text geometries
    const font = this.entity.area.game.assets.getFont('Number');
    this.textGeometry = this.entries.map(({ text = '' }) => {
      return new THREE.TextGeometry(text, { font, size: 0.8, height: 1, curveSegments: 1 });
    });

    // Build all of the instanced objects
    for (const [index, { relativePosition }] of this.entries.entries()) {
      // Left and right walls
      const leftSideTransform = new THREE.Matrix4()
        .makeScale(1, WALL_HEIGHT, SIDE_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))
        .setPosition(0, WALL_HEIGHT / 2, SIDE_WIDTH / 2 + ARCH_WIDTH / 2 + -relativePosition * TOTAL_WIDTH);
      this.leftSideWall.setMatrixAt(index, leftSideTransform);

      const rightSideTransform = new THREE.Matrix4()
        .makeScale(1, WALL_HEIGHT, SIDE_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))
        .setPosition(0, WALL_HEIGHT / 2, -SIDE_WIDTH / 2 - ARCH_WIDTH / 2 + -relativePosition * TOTAL_WIDTH);
      this.rightSideWall.setMatrixAt(index, rightSideTransform);

      // Top of the arch
      const topTransform = new THREE.Matrix4()
        .makeScale(1, WALL_HEIGHT - ARCH_HEIGHT, ARCH_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))
        .setPosition(0, ARCH_HEIGHT + (WALL_HEIGHT - ARCH_HEIGHT) / 2, -relativePosition * TOTAL_WIDTH);
      this.topWall.setMatrixAt(index, topTransform);

      // Mini boxes between the sides and top
      const leftMiniTransform = new THREE.Matrix4()
        .makeScale(1, MINI_HEIGHT, MINI_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))
        .setPosition(0, ARCH_HEIGHT - MINI_HEIGHT / 2, (ARCH_WIDTH - MINI_WIDTH) / 2 + -relativePosition * TOTAL_WIDTH);
      this.leftMiniCube.setMatrixAt(index, leftMiniTransform);

      const rightMiniTransform = new THREE.Matrix4()
        .makeScale(1, MINI_HEIGHT, MINI_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))
        .setPosition(
          0,
          ARCH_HEIGHT - MINI_HEIGHT / 2,
          (-ARCH_WIDTH + MINI_WIDTH) / 2 + -relativePosition * TOTAL_WIDTH,
        );
      this.rightMiniCube.setMatrixAt(index, rightMiniTransform);

      // The arch itself
      const archTransform = new THREE.Matrix4()
        .makeScale(WALL_DEPTH * 2, 0.5, 0.5)
        .setPosition(0, -0.2, -relativePosition * TOTAL_WIDTH);
      this.arch.setMatrixAt(index, archTransform);

      // Tunnel inside of the arch
      const leftInsideTransform = new THREE.Matrix4()
        .makeScale(INSIDE_DEPTH - WALL_DEPTH, ARCH_HEIGHT, 1)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI))
        .setPosition(
          -WALL_DEPTH / 2 - (INSIDE_DEPTH - WALL_DEPTH) / 2,
          ARCH_HEIGHT / 2,
          ARCH_WIDTH / 2 + -relativePosition * TOTAL_WIDTH,
        );
      this.leftInsideWall.setMatrixAt(index, leftInsideTransform);

      const rightInsideTransform = new THREE.Matrix4()
        .makeScale(INSIDE_DEPTH - WALL_DEPTH, ARCH_HEIGHT, 1)
        .setPosition(
          -WALL_DEPTH / 2 - (INSIDE_DEPTH - WALL_DEPTH) / 2,
          ARCH_HEIGHT / 2,
          -ARCH_WIDTH / 2 + -relativePosition * TOTAL_WIDTH,
        );
      this.rightInsideWall.setMatrixAt(index, rightInsideTransform);

      const topInsideTransform = new THREE.Matrix4()
        .makeScale(INSIDE_DEPTH - WALL_DEPTH, 1, ARCH_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2))
        .setPosition(-WALL_DEPTH / 2 - (INSIDE_DEPTH - WALL_DEPTH) / 2, ARCH_HEIGHT, -relativePosition * TOTAL_WIDTH);
      this.topInsideWall.setMatrixAt(index, topInsideTransform);

      // Torches
      const leftTorchTransform = new THREE.Matrix4()
        .makeScale(0.5, 1, 0.5)
        .setPosition(WALL_DEPTH, 4.4, 3.175 + -relativePosition * TOTAL_WIDTH);
      this.torch.setMatrixAt(2 * index, leftTorchTransform);

      const rightTorchTransform = new THREE.Matrix4()
        .makeScale(0.5, 1, 0.5)
        .setPosition(WALL_DEPTH, 4.4, -3.175 + -relativePosition * TOTAL_WIDTH);
      this.torch.setMatrixAt(2 * index + 1, rightTorchTransform);

      // Torch lights
      const leftTorchLight: THREE.PointLight = new THREE.PointLight(0xffd050, 1, 13, 1);
      leftTorchLight.position.set(WALL_DEPTH + 0.3, 5.3, 3.175 + -relativePosition * TOTAL_WIDTH);
      this.entity.object.add(leftTorchLight);

      const rightTorchLight: THREE.PointLight = leftTorchLight.clone();
      rightTorchLight.position.set(WALL_DEPTH + 0.3, 5.3, -3.175 + -relativePosition * TOTAL_WIDTH);
      this.entity.object.add(rightTorchLight);

      this.torchLights.get(relativePosition).push(leftTorchLight, rightTorchLight);

      // 3D Text
      const textGeometry = this.textGeometry[index];
      textGeometry.computeBoundingBox();
      const boundingBox = textGeometry.boundingBox;
      const textWidth = boundingBox.max.x - boundingBox.min.x;
      const textHeight = boundingBox.max.y - boundingBox.min.y;

      const textMesh = new THREE.Mesh(textGeometry, FONT_MATERIAL);
      textMesh.rotation.set(0, Math.PI / 2, 0);
      textMesh.position.set(-0.8, ARCH_HEIGHT + 2 * textHeight, textWidth / 2 + -relativePosition * TOTAL_WIDTH);
      this.entity.object.add(textMesh);
    }

    // Mark all of the instanced meshes for update
    this.leftSideWall.instanceMatrix.needsUpdate = true;
    this.rightSideWall.instanceMatrix.needsUpdate = true;
    this.topWall.instanceMatrix.needsUpdate = true;
    this.leftMiniCube.instanceMatrix.needsUpdate = true;
    this.rightMiniCube.instanceMatrix.needsUpdate = true;
    this.arch.instanceMatrix.needsUpdate = true;
    this.leftInsideWall.instanceMatrix.needsUpdate = true;
    this.rightInsideWall.instanceMatrix.needsUpdate = true;
    this.topInsideWall.instanceMatrix.needsUpdate = true;
    this.torch.instanceMatrix.needsUpdate = true;
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
      repeatY: WALL_HEIGHT / WALL_SCALE,
      offsetX: 0,
      offsetY: (WALL_HEIGHT / WALL_SCALE) % 1.0,
    });
  }

  private buildRightSideTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'RightSide', {
      repeatX: SIDE_WIDTH / WALL_SCALE,
      repeatY: WALL_HEIGHT / WALL_SCALE,
      offsetX: ((SIDE_WIDTH + ARCH_WIDTH) / WALL_SCALE) % 1.0,
      offsetY: (WALL_HEIGHT / WALL_SCALE) % 1.0,
    });
  }

  private buildTopTexture(name: string): THREE.Texture {
    return this.dynamicallyBuildTexture(name, 'Top', {
      repeatX: ARCH_WIDTH / WALL_SCALE,
      repeatY: (WALL_HEIGHT - ARCH_HEIGHT) / WALL_SCALE,
      offsetX: (SIDE_WIDTH / WALL_SCALE) % 1.0,
      offsetY: ((ARCH_HEIGHT / WALL_SCALE) % 1.0) + ((WALL_HEIGHT / WALL_SCALE) % 1.0),
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

  public dispose(): void {
    this.entity.destroy();
  }

  public setTorchPosition(relativePosition: number): void {
    // Disable all torches
    this.torchLights.forEach((torches) => torches.forEach((torch) => (torch.visible = false)));

    // Enable the center, left, and right torches
    const centerTorches = this.torchLights.get(relativePosition) ?? [];
    const leftTorches = this.torchLights.get(relativePosition - 1) ?? [];
    const rightTorches = this.torchLights.get(relativePosition + 1) ?? [];

    centerTorches.forEach((torch) => (torch.visible = true));
    leftTorches.forEach((torch) => (torch.visible = true));
    rightTorches.forEach((torch) => (torch.visible = true));
  }

  public setTorchBrightness(brightness: number): void {
    this.torchLights.forEach((torches) => torches.forEach((torch) => (torch.intensity = brightness)));
  }

  onDestroy(): void {}

  onDispose(): void {
    this.leftSideWall.dispose();
    this.rightSideWall.dispose();
    this.topWall.dispose();
    this.leftMiniCube.dispose();
    this.rightMiniCube.dispose();
    this.arch.dispose();
    this.leftInsideWall.dispose();
    this.rightInsideWall.dispose();
    this.topInsideWall.dispose();
    this.torch.dispose();

    for (const textGeometry of this.textGeometry) {
      textGeometry.dispose();
    }
  }

  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
