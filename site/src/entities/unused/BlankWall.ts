import { Entity, EntityState } from 'engine/entity';
import { Key } from 'engine/input';
import { TOTAL_WIDTH, WALL_DEPTH, WALL_HEIGHT, WALL_SCALE } from '../Constants';
import TextTexture from '@seregpie/three.text-texture';
import * as THREE from 'three';

const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const PLANE_GEOMETRY = new THREE.PlaneGeometry();
const BLANK_MATERIAL = new THREE.MeshStandardMaterial();

const CENTER_TEXT_Y = 6.5;
const DEFAULT_TEXTURE_WIDTH = 10;
const NORMAL_SCALE_FACTOR = 2;

/**
 * Blank wall in the maze
 */
export class BlankWall implements EntityState {
  public readonly tags: string[] = ['wall'];

  private entity: Entity<this>;

  private relativePosition: number;

  private graffitiPlane: THREE.Mesh;
  private angle = 0;

  // Internal resources that must be freed:
  private textTexture: TextTexture;
  private normalTexture: THREE.Texture;
  private normalCanvas: HTMLCanvasElement;
  private graffitiMaterial: THREE.MeshStandardMaterial;

  constructor(relativePosition = 0) {
    this.relativePosition = relativePosition;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    // Wall texture
    BLANK_MATERIAL.map = this.buildWallTexture('BrickColor');
    BLANK_MATERIAL.normalMap = this.buildWallTexture('BrickNormal');
    BLANK_MATERIAL.aoMap = this.buildWallTexture('BrickOcclusion');

    this.entity.object = new THREE.Group();

    // The wall object
    const wall: THREE.Mesh = new THREE.Mesh(BOX_GEOMETRY, BLANK_MATERIAL);
    wall.scale.set(WALL_DEPTH, WALL_HEIGHT, TOTAL_WIDTH);
    wall.position.set(-WALL_DEPTH / 2, WALL_HEIGHT / 2, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(wall);

    // Torch
    const torch: THREE.Object3D = this.entity.area.game.assets.getObject('WallTorch').clone(false);
    torch.scale.set(0.5, 1, 0.5);
    torch.position.set(0, 4.4, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(torch);

    // Torch Lights
    const torchLight: THREE.PointLight = new THREE.PointLight(0xffd050, 1, 10, 1);
    torchLight.position.set(WALL_DEPTH + 0.3, 5.3, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(torchLight);

    // Graffiti textures and materials
    const textTexture = new TextTexture({
      alignment: 'center',
      color: 'red',
      fontFamily: 'Gang Bang Crime',
      fontSize: 96,
      strokeColor: '#550000',
      strokeWidth: 0.05,
      fontStyle: 'italic',
      text: 'Dead End',
    });
    textTexture.loadFontFace().then(() => {
      textTexture.redraw();
      this.refreshGraffiti();
    });
    this.textTexture = textTexture;

    this.normalCanvas = document.createElement('canvas');
    this.normalTexture = new THREE.Texture(this.normalCanvas);
    this.graffitiMaterial = new THREE.MeshStandardMaterial({ map: textTexture, normalMap: this.normalTexture });
    this.graffitiMaterial.transparent = true;

    // Graffiti Plane
    const graffitiPlane = new THREE.Mesh(PLANE_GEOMETRY, this.graffitiMaterial);
    graffitiPlane.position.set(0.0, CENTER_TEXT_Y, -this.relativePosition * TOTAL_WIDTH);
    graffitiPlane.rotation.set(0, Math.PI / 2, 0);
    this.graffitiPlane = graffitiPlane;
    this.entity.object.add(graffitiPlane);
  }

  /**
   * Build the texture to use for the side wall
   */
  private buildWallTexture(imageName: string): THREE.Texture {
    const assets = this.entity.area.game.assets;
    const textureName = `${imageName}-Blank`;

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

  /**
   * Refresh all of the graffiti on the wall
   *
   * @param width How wide should the texture be in the room
   */
  private refreshGraffiti(width = DEFAULT_TEXTURE_WIDTH) {
    const relativeHeight = width * (this.textTexture.height / this.textTexture.width);
    this.graffitiPlane.scale.set(width, relativeHeight, 1);
    this.graffitiPlane.rotation.x = this.angle;

    this.refreshGraffitiNormalsTexture(width, relativeHeight);
  }

  /**
   * Refresh the normal texture given the width and height of the graffiti plane
   */
  private refreshGraffitiNormalsTexture(width: number, height: number) {
    const bricks = this.entity.area.game.assets.getImage('BrickNormal');
    this.normalCanvas.width = bricks.width * NORMAL_SCALE_FACTOR;
    this.normalCanvas.height = bricks.height * NORMAL_SCALE_FACTOR;

    const leftX = TOTAL_WIDTH / 2 - width / 2;
    const leftOffset = (leftX / WALL_SCALE) % 1.0;

    const topY = CENTER_TEXT_Y + height / 2;
    const topOffset = (topY / WALL_SCALE) % 1.0;

    // Scale, rotate, and translate the texture to match the current plane position
    const g2d = this.normalCanvas.getContext('2d');
    g2d.imageSmoothingEnabled = false;
    g2d.translate(this.normalCanvas.width / 2, this.normalCanvas.height / 2);
    g2d.scale((WALL_SCALE * NORMAL_SCALE_FACTOR) / width, (WALL_SCALE * NORMAL_SCALE_FACTOR) / height);
    g2d.rotate(this.angle);
    g2d.translate(
      (-this.normalCanvas.width * width) / (WALL_SCALE * NORMAL_SCALE_FACTOR * 2),
      (-this.normalCanvas.height * height) / (WALL_SCALE * NORMAL_SCALE_FACTOR * 2),
    );
    g2d.translate(-leftOffset * bricks.width, topOffset * bricks.height);

    // Draw the individual tiles for the texture
    for (let x = -2; x <= Math.ceil(width); x += 1) {
      for (let y = -2; y <= Math.ceil(height); y += 1) {
        g2d.drawImage(bricks, x * bricks.width, y * bricks.height);
      }
    }

    this.normalTexture.needsUpdate = true;
  }

  /**
   * Free any unused resources when the wall is destroyed
   */
  onDestroy(): void {
    this.graffitiMaterial.dispose();
    this.textTexture.dispose();
    this.normalTexture.dispose();
  }

  onStep(): void {
    const input = this.entity.area.game.input;
    if (input.isKeyStarted(Key.N)) {
      this.angle += Math.PI / 32;
      this.refreshGraffiti();
    }
    if (input.isKeyStarted(Key.P)) {
      this.angle -= Math.PI / 32;
      this.refreshGraffiti();
    }
    if (input.isKeyStarted(Key.H)) {
      this.entity.object.children[3].visible = !this.entity.object.children[3].visible;
    }
  }

  onTimer(_timerIndex: number): void {}

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
