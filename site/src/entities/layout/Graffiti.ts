import { Entity, EntityState } from 'engine/entity';
import { pickRandomArray } from 'engine/helpers';
import { TOTAL_WIDTH, WALL_SCALE } from '../Constants';
import TextTexture from '@seregpie/three.text-texture';
import * as THREE from 'three';
import { LayoutEntity } from './LayoutEntity';

// Anything left unspecified is randomized or set to default value
export interface GraffitiProps {
  seed?: string;
  text?: string;
  font?: GraffitiFontProps | string;
  width?: number;
  angle?: number;
}

export interface GraffitiFontProps {
  alignment?: string;
  backgroundColor?: string;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
  fontStyle?: string;
  fontVariant?: string;
  fontWeight?: string;
  lineGap?: number;
  padding?: number;
  strokeColor?: string;
  strokeWidth?: number;
}

const PLANE_GEOMETRY = new THREE.PlaneGeometry();

const CENTER_TEXT_Y = 6.5;
const DEFAULT_TEXTURE_WIDTH = 10;
const NORMAL_SCALE_FACTOR = 2;

const ALL_FONTS: string[] = [
  '08 Underground',
  'A Another Tag',
  'A Attack Graffiti',
  'A Dripping Marker',
  'Barrio Rifa',
  'Bopollux',
  'Bored Schoolboy',
  'Dark Font',
  'DJ Gross',
  'Elevenoone',
  'Gang Bang Crime',
  'Graffonti',
  'I Lost It In The Street',
  'Insane',
  'Muro SP',
  'Neo Bopollux',
  'Pixel Retro SP',
  'Real Breakerz',
  'Reskagraf',
  'Souper 3',
  'Street Style',
];

/**
 * Graffiti that is on top of a blank wall
 */
export class Graffiti implements EntityState, LayoutEntity {
  public readonly tags: string[] = ['layout-entity'];

  private entity: Entity<this>;
  private relativePosition: number;
  private graffitiProps: GraffitiProps;

  private graffitiPlane: THREE.Mesh;
  private angle = 0;

  // Internal resources that must be freed:
  private textTexture: TextTexture;
  private normalTexture: THREE.Texture;
  private normalCanvas: HTMLCanvasElement;
  private graffitiMaterial: THREE.MeshStandardMaterial;

  constructor(relativePosition = 0, props: GraffitiProps = {}) {
    this.relativePosition = relativePosition;
    this.graffitiProps = props;
  }

  onCreate(entity: Entity<this>): void {
    this.entity = entity;

    // Graffiti textures and materials
    const textTexture = new TextTexture({
      alignment: 'center',
      color: 'red',
      fontFamily: pickRandomArray(ALL_FONTS),
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

  public dispose(): void {
    this.entity.destroy();
  }

  /**
   * Free any unused resources when the wall is destroyed
   */
  onDestroy(): void {
    this.graffitiMaterial.dispose();
    this.textTexture.dispose();
    this.normalTexture.dispose();
  }

  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}
