import { Entity, EntityState } from 'engine/entity';
import { TOTAL_WIDTH, WALL_DEPTH, WALL_HEIGHT, WALL_SCALE } from '../Constants';
import { LayoutEntity, TorchEntity } from './LayoutEntity';
import * as THREE from 'three';

export interface BlankWallProps {
  relativePosition: number;
}

// Static data storage
const PLANE_GEOMETRY = new THREE.PlaneGeometry();
const BLANK_WALL_MATERIAL = new THREE.MeshStandardMaterial();
const TORCH_MATERIAL = new THREE.MeshStandardMaterial();

/**
 * Group of blank walls in the maze.
 *
 * Be sure to destroy this entity before moving to another room, or there will be a memory leak!
 */
export class BlankWallGroup implements EntityState, LayoutEntity, TorchEntity {
  public readonly tags: string[] = ['layout-entity', 'torch-entity'];

  private entity: Entity<this>;
  private entries: BlankWallProps[];

  // Resources that must be freed
  private wall: THREE.InstancedMesh;
  private torch: THREE.InstancedMesh;

  // Lights for dimming
  private torchLights: Map<number, THREE.PointLight[]>;

  constructor(entries: BlankWallProps[]) {
    this.entries = entries;
    this.torchLights = new Map(entries.map(({ relativePosition }) => [relativePosition, []]));
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;
    this.entity.object = new THREE.Group();

    // Wall texture
    BLANK_WALL_MATERIAL.map = this.buildWallTexture('BrickColor');
    BLANK_WALL_MATERIAL.normalMap = this.buildWallTexture('BrickNormal');
    BLANK_WALL_MATERIAL.aoMap = this.buildWallTexture('BrickOcclusion');

    // Create all of the instanced meshes
    this.wall = new THREE.InstancedMesh(PLANE_GEOMETRY, BLANK_WALL_MATERIAL, this.entries.length);

    const torch: THREE.Mesh = this.entity.area.game.assets.getObject('WallTorch') as THREE.Mesh;
    TORCH_MATERIAL.copy(torch.material as THREE.MeshStandardMaterial);
    this.torch = new THREE.InstancedMesh(torch.geometry, TORCH_MATERIAL, this.entries.length);

    this.entity.object.add(this.wall, this.torch);

    // Build all of the instanced objects
    for (const [index, { relativePosition }] of this.entries.entries()) {
      // The wall object
      const wallTransform = new THREE.Matrix4()
        .makeScale(1, WALL_HEIGHT, TOTAL_WIDTH)
        .multiply(new THREE.Matrix4().makeRotationY(Math.PI / 2))
        .setPosition(0, WALL_HEIGHT / 2, -relativePosition * TOTAL_WIDTH);
      this.wall.setMatrixAt(index, wallTransform);

      // Torch
      const torchTransform = new THREE.Matrix4()
        .makeScale(0.5, 1, 0.5)
        .setPosition(0, 4.4, -relativePosition * TOTAL_WIDTH);
      this.torch.setMatrixAt(index, torchTransform);

      // Torch Light
      const torchLight: THREE.PointLight = new THREE.PointLight(0xffd050, 1, 10, 1);
      torchLight.position.set(WALL_DEPTH + 0.3, 5.3, -relativePosition * TOTAL_WIDTH);
      this.entity.object.add(torchLight);
      this.torchLights.get(relativePosition).push(torchLight);
    }

    // Mark all of the instanced meshes for update
    this.wall.instanceMatrix.needsUpdate = true;
    this.torch.instanceMatrix.needsUpdate = true;
  }

  /**
   * Build the texture to use for the side wall
   */
  private buildWallTexture(imageName: string): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${imageName}-BlankWall`;

    if (assets.hasTexture(textureName)) {
      return assets.getTexture(textureName);
    }

    const image = assets.getImage(imageName);
    const texture = new THREE.Texture(image);
    texture.needsUpdate = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(TOTAL_WIDTH / WALL_SCALE, WALL_HEIGHT / WALL_SCALE);

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

  /**
   * Dispose of all resources
   */
  onDestroy(): void {
    this.wall.dispose();
    this.torch.dispose();
  }

  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
