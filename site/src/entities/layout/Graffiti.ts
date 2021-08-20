import { Entity, EntityState } from 'engine/entity';
import { RandomFn, pickRandomArray, randomFloat } from 'engine/helpers';
import { TOTAL_WIDTH, WALL_SCALE } from '../Constants';
import TextTexture from '@seregpie/three.text-texture';
import * as seededRandom from 'seedrandom';
import * as THREE from 'three';

// Anything left unspecified is randomized or set to default value
export interface GraffitiProps {
  seed?: string;
  text?: string;
  font?: GraffitiFontProps | BuiltInFont;
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

// All built-in fonts the game can generate
export enum BuiltInFont {
  Underground = 'Underground',
  AAnotherTag = 'A Another Tag',
  AAttackGraffiti = 'A Attack Graffiti',
  ADrippingMarker = 'A Dripping Marker',
  BarrioRifa = 'Barrio Rifa',
  Bopollux = 'Bopollux',
  DJGross = 'DJ Gross',
  Elevenoone = 'Elevenoone',
  GangBangCrime = 'Gang Bang Crime',
  Graffonti = 'Graffonti',
  ILostItInTheStreets = 'I Lost It In The Street',
  Insane = 'Insane',
  MuroSP = 'Muro SP',
  NeoBopollux = 'Neo Bopollux',
  PixelRetroSP = 'Pixel Retro SP',
  RealBreakerz = 'Real Breakerz',
  Reskagraf = 'Reskagraf',
  StreetStyle = 'Street Style',
}

// All messages that can show
const GRAFFITI_MESSAGES: string[] = [
  'Help!!!',
  "I'm lost",
  'Numbers...\nNothing but\nNumbers...',
  'There is\nno end',
  'No way out',
  'Some primes are\ndead ends',
  "By the time anyone reads\nthis, I'm probably dead.",
  '127 is DEATH!',
  'How is this\npossible?',
  'What is the\npattern?',
  'Composite\nIs\nDEATH',
  'Comprosoft\nwas here',
  'The Prime Number Maze\nWilliam Paulsen',
  'Infinity!',
  'Hamming = 1',
  'I am going\ninsane',
  'Trapped!',

  '<Prime>', // Special Case: Show a random prime
];

// List of random primes that can appear as graffiti
// prettier-ignore
const SOME_PRIMES: number[] = [
  2,   3,   5,   7,   11,  13,  17,  19,  23,  29,  31,  37,  41,
  43,  47,  53,  59,  61,  67,  71,  73,  79,  83,  89,  97,  101,
  103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167,
  173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239,
  241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313,
  317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397,
  401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467,
  479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569,
  571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643,
  647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733,
  739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823,
  827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911,
  919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997
];

// Certain fonts do not work well with certain types of text
interface FontDetails {
  lowercaseOnly?: boolean /* Default: false */;
  noNumbers?: boolean /* Default: false */;
  noPunctuation?: boolean /* Default: false */;
  noNewline?: boolean /* Default: false */;
  outline?: number /* Default: 0 */;
}

const DEFAULT_OUTLINE = 0.05;
const BUILT_IN_FONT_DETAILS: Record<BuiltInFont, FontDetails> = {
  [BuiltInFont.Underground]: { lowercaseOnly: true, noNumbers: true, outline: DEFAULT_OUTLINE },
  [BuiltInFont.AAnotherTag]: { outline: DEFAULT_OUTLINE },
  [BuiltInFont.AAttackGraffiti]: { outline: DEFAULT_OUTLINE },
  [BuiltInFont.ADrippingMarker]: { outline: DEFAULT_OUTLINE },
  [BuiltInFont.BarrioRifa]: { noPunctuation: true },
  [BuiltInFont.Bopollux]: { noNumbers: true, noPunctuation: true, outline: DEFAULT_OUTLINE },
  [BuiltInFont.DJGross]: { noNewline: true },
  [BuiltInFont.Elevenoone]: {},
  [BuiltInFont.GangBangCrime]: { outline: DEFAULT_OUTLINE },
  [BuiltInFont.Graffonti]: { noPunctuation: true },
  [BuiltInFont.ILostItInTheStreets]: { noNewline: true },
  [BuiltInFont.Insane]: { lowercaseOnly: true, noNumbers: true, noPunctuation: true },
  [BuiltInFont.MuroSP]: { noNewline: true },
  [BuiltInFont.NeoBopollux]: { noNumbers: true, noPunctuation: true, outline: DEFAULT_OUTLINE },
  [BuiltInFont.PixelRetroSP]: { noPunctuation: true, noNewline: true },
  [BuiltInFont.RealBreakerz]: { noNewline: true },
  [BuiltInFont.Reskagraf]: { noPunctuation: true, outline: DEFAULT_OUTLINE },
  [BuiltInFont.StreetStyle]: {},
};

// All possible font colors and any supported border colors
interface FontColor {
  color: string;
  outlineColors: string[];
}

const FONT_COLORS: FontColor[] = [
  { color: 'red', outlineColors: ['black', '#550000'] },
  { color: '#BDB76B', outlineColors: ['black'] },
  { color: '#556B2F', outlineColors: ['black'] },
  { color: 'blue', outlineColors: ['black'] },
  { color: '#8A2BE2', outlineColors: [] },
  { color: 'black', outlineColors: [] },
];

// Static data storage
const PLANE_GEOMETRY = new THREE.PlaneGeometry();

// Geometry constants
const CENTER_TEXT_Y = 6.5;
const DEFAULT_TEXTURE_WIDTH = 8;
const NORMAL_SCALE_FACTOR = 2;
const MIN_ANGLE = -Math.PI / 6;
const MAX_ANGLE = Math.PI / 6;
const OUTLINE_PROBABILITY = 0.5;

/**
 * Graffiti that is on top of a blank wall
 */
export class Graffiti implements EntityState {
  public readonly tags: string[] = ['layout-entity'];

  private entity: Entity<this>;
  private relativePosition: number;
  private graffitiProps: GraffitiProps;

  // Generated values
  private width: number;
  private angle: number;

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
    this.generateValues();
    this.textTexture.loadFontFace().then(() => {
      this.textTexture.redraw();
      this.refreshGraffiti();
    });

    this.normalCanvas = document.createElement('canvas');
    this.normalTexture = new THREE.Texture(this.normalCanvas);
    this.graffitiMaterial = new THREE.MeshStandardMaterial({ map: this.textTexture, normalMap: this.normalTexture });
    this.graffitiMaterial.transparent = true;

    // Graffiti Plane
    const graffitiPlane = new THREE.Mesh(PLANE_GEOMETRY, this.graffitiMaterial);
    graffitiPlane.position.set(0.0, CENTER_TEXT_Y, -this.relativePosition * TOTAL_WIDTH);
    graffitiPlane.rotation.set(0, Math.PI / 2, 0);
    this.entity.object = graffitiPlane;
  }

  /**
   * Handle all of the graffiti generation
   */
  private generateValues(): void {
    const seed = this.graffitiProps.seed ?? Math.random().toString();
    const prng = seededRandom(seed);

    // Figure out the text
    let text = this.graffitiProps.text ?? pickRandomArray(GRAFFITI_MESSAGES, prng);
    if (text === '<Prime>') {
      // Special Case: Show a random prime
      text = pickRandomArray(SOME_PRIMES, prng).toString();
    }

    // Build the font
    switch (typeof this.graffitiProps.font) {
      case 'undefined':
        this.textTexture = Graffiti.generateTextTexture(text, prng);
        break;

      case 'string':
        this.textTexture = Graffiti.generateTextTexture(text, prng, this.graffitiProps.font);
        break;

      default:
        this.textTexture = new TextTexture({ text, ...this.graffitiProps.font });
        break;
    }

    // Set the width and angle
    this.width = this.graffitiProps.width ?? DEFAULT_TEXTURE_WIDTH;
    this.angle = this.graffitiProps.angle ?? randomFloat(MIN_ANGLE, MAX_ANGLE, prng);
  }

  /**
   * Generate a text texture given the text and an optional built-in font
   *
   * @param text Text to show
   * @param random Random number generator
   * @param font Name of a built-in font that has already been specified
   */
  private static generateTextTexture(text: string, random: RandomFn, font?: BuiltInFont): TextTexture {
    // Figure out which fonts are allowed when picking a random font
    const textHasNumber = hasNumber(text);
    const textHasPunctuation = hasPunctuation(text);
    const textHasNewline = hasNewline(text);
    const allowedFontEntries = Object.entries(BUILT_IN_FONT_DETAILS)
      .filter(
        ([_, { noNumbers, noPunctuation, noNewline }]) =>
          !((noNumbers && textHasNumber) || (noPunctuation && textHasPunctuation) || (noNewline && textHasNewline)),
      )
      .map(([font, _]) => font as BuiltInFont);

    // Pick a random font, or use the pre-selected one
    const pickedFont = font ?? pickRandomArray(allowedFontEntries, random);
    const fontDetails = BUILT_IN_FONT_DETAILS[pickedFont];

    // Text might be lowercase only
    if (fontDetails.lowercaseOnly) {
      text = text.toLowerCase();
    }

    // Pick the font color and outline color
    const fontColor = pickRandomArray(FONT_COLORS, random);
    const outlineColor: string | null =
      fontColor.outlineColors.length > 0 ? pickRandomArray(fontColor.outlineColors) : null;

    // Should the font have an outline
    let fontOutline = 0;
    if (fontDetails.outline && outlineColor !== null && random() < OUTLINE_PROBABILITY) {
      fontOutline = fontDetails.outline;
    }

    // Build the texture!
    return new TextTexture({
      text,
      fontFamily: pickedFont,
      fontSize: 96,
      alignment: 'center',
      color: fontColor.color,
      strokeWidth: fontOutline,
      strokeColor: outlineColor,
    });
  }

  /**
   * Refresh all of the graffiti on the wall
   *
   * @param width How wide should the texture be in the room
   */
  private refreshGraffiti(width = DEFAULT_TEXTURE_WIDTH) {
    const relativeHeight = width * (this.textTexture.height / this.textTexture.width);
    this.entity.object.scale.set(width, relativeHeight, 1);
    this.entity.object.rotation.x = this.angle;

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

  onDestroy(): void {}

  /**
   * Free any unused resources when the wall is disposed
   */
  onDispose(): void {
    this.graffitiMaterial.dispose();
    this.textTexture.dispose();
    this.normalTexture.dispose();
  }

  onStep(): void {}
  onTimer(_timerIndex: number): void {}
  onDraw(_g2d: CanvasRenderingContext2D): void {}
}

//
// String testing functions
//
function hasNumber(input: string): boolean {
  return /[0-9]/.test(input);
}

function hasPunctuation(input: string): boolean {
  return /[!-/:-@[-`{-~}]/.test(input);
}

function hasNewline(input: string): boolean {
  return /\n/.test(input);
}
