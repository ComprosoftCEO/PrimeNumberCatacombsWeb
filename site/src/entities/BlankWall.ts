import { Entity, EntityState } from 'engine/entity';
import { lerp } from 'engine/helpers';
import { Key } from 'engine/input';
import { TOTAL_WIDTH, WALL_DEPTH, WALL_HEIGHT, WALL_SCALE } from './Constants';
import TextTexture from '@seregpie/three.text-texture';
import * as THREE from 'three';

const BOX_GEOMETRY = new THREE.BoxGeometry(1, 1, 1);
const PLANE_GEOMETRY = new THREE.PlaneGeometry();
const BLANK_MATERIAL = new THREE.MeshStandardMaterial();

const CENTER_TEXT_Y = 6.5;
const TEXTURE_WIDTH = 10;

/**
 * Blank wall in the maze
 */
export class BlankWall implements EntityState {
  public readonly tags: string[] = ['wall'];

  private entity: Entity<this>;

  private relativePosition: number;

  private originalCanvas: HTMLCanvasElement;
  private newCanvas: HTMLCanvasElement;
  private texture: TextTexture;
  private graffitiPlane: THREE.Mesh;
  private height = 0;
  private angle = -Math.PI / 32;

  private normalCanvas: HTMLCanvasElement;
  private normalTexture: THREE.Texture;

  constructor(relativePosition = 0) {
    this.relativePosition = relativePosition;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    BLANK_MATERIAL.map = this.buildTexture('BrickColor');
    BLANK_MATERIAL.normalMap = this.buildTexture('BrickNormal');
    BLANK_MATERIAL.aoMap = this.buildTexture('BrickOcclusion');

    this.entity.object = new THREE.Group();

    // The wall object
    const wall: THREE.Mesh = new THREE.Mesh(BOX_GEOMETRY, BLANK_MATERIAL);
    wall.scale.set(WALL_DEPTH, WALL_HEIGHT, TOTAL_WIDTH);
    wall.position.set(-WALL_DEPTH / 2, WALL_HEIGHT / 2, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(wall);

    // Torch
    const leftTorch: THREE.Object3D = this.entity.area.game.assets.getObject('WallTorch').clone(false);
    leftTorch.scale.set(0.5, 1, 0.5);
    leftTorch.position.set(0, 4.4, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(leftTorch);

    // Torch Lights
    const leftTorchLight: THREE.PointLight = new THREE.PointLight(0xffd050, 1, 10, 1);
    leftTorchLight.position.set(WALL_DEPTH + 0.3, 5.3, -this.relativePosition * TOTAL_WIDTH);
    this.entity.object.add(leftTorchLight);

    const texture = new TextTexture({
      alignment: 'center',
      color: 'red',
      fontFamily: 'Graffiti',
      fontSize: 96,
      strokeColor: '#550000',
      strokeWidth: 0.05,
      fontStyle: 'italic',
      text: 'There is\nNo\nEscape',
    });
    texture.loadFontFace().then(() => {
      texture.redraw();

      this.height = (TEXTURE_WIDTH * texture.height) / texture.width;
      this.originalCanvas = texture.image as HTMLCanvasElement;
      this.newCanvas = document.createElement('canvas');
      this.newCanvas.width = 2 * this.originalCanvas.width;
      this.newCanvas.height = 2 * this.originalCanvas.height;
      texture.image = this.newCanvas;
      this.texture = texture;

      this.normalCanvas = document.createElement('canvas');
      this.normalTexture = new THREE.Texture();
      this.normalTexture.image = this.normalCanvas;

      const material = new THREE.MeshStandardMaterial({ map: texture, normalMap: this.normalTexture });
      material.transparent = true;

      this.graffitiPlane = new THREE.Mesh(PLANE_GEOMETRY, material);
      this.graffitiPlane.position.set(0.0, CENTER_TEXT_Y, -this.relativePosition * TOTAL_WIDTH);
      this.graffitiPlane.rotation.y = Math.PI / 2;
      this.entity.object.add(this.graffitiPlane);

      this.recomputeTexture();
    });
  }

  /**
   * Dynamically build the texture to use for the side wall
   */
  private buildTexture(imageName: string): THREE.Texture {
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

  onDestroy(): void {}

  onStep(): void {
    const input = this.entity.area.game.input;
    if (input.isKeyStarted(Key.N)) {
      this.recomputeTexture();
    }
    if (input.isKeyStarted(Key.H)) {
      this.entity.object.children[3].visible = !this.entity.object.children[3].visible;
    }
  }

  private recomputeTexture() {
    if (this.newCanvas === undefined) {
      return;
    }

    this.angle += Math.PI / 32;

    const ctx: CanvasRenderingContext2D = this.newCanvas.getContext('2d');
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.clearRect(0, 0, this.newCanvas.width, this.newCanvas.height);
    ctx.translate(this.originalCanvas.width, this.originalCanvas.height);
    ctx.rotate(this.angle);
    ctx.drawImage(this.originalCanvas, -this.originalCanvas.width / 2, -this.originalCanvas.height / 2);
    ctx.restore();

    this.texture.image = this.newCanvas;
    this.texture.needsUpdate = true;

    const width = lerp(
      TEXTURE_WIDTH,
      this.height * (this.originalCanvas.width / this.originalCanvas.height),
      Math.abs(Math.sin(this.angle)),
    );
    const height = lerp(
      this.height,
      TEXTURE_WIDTH * (this.originalCanvas.height / this.originalCanvas.width),
      Math.abs(Math.sin(this.angle)),
    );

    this.graffitiPlane.scale.set(width, height, 1);
    this.buildTextNormals(width, height);
  }

  private buildTextNormals(width: number, height: number) {
    const bricks = this.entity.area.game.assets.getImage('BrickNormal');

    this.normalCanvas.width = bricks.width;
    this.normalCanvas.height = bricks.height;

    const leftX = TOTAL_WIDTH / 2 - width / 2;
    const topY = CENTER_TEXT_Y + height / 2;

    const topOffset = (topY / WALL_SCALE) % 1.0;
    const leftOffset = (leftX / WALL_SCALE) % 1.0;

    const normalCtx = this.normalCanvas.getContext('2d');
    normalCtx.scale(WALL_SCALE / width, WALL_SCALE / height);
    normalCtx.translate(-leftOffset * bricks.width, topOffset * bricks.height);

    for (let x = -1; x < Math.ceil(width); x += 1) {
      for (let y = -1; y < Math.ceil(height); y += 1) {
        normalCtx.drawImage(bricks, x * bricks.width, y * bricks.height);
      }
    }

    this.normalTexture.needsUpdate = true;
  }

  onTimer(_timerIndex: number): void {}

  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
