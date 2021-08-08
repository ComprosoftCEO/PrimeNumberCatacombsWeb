import { Game } from 'engine/game';
import { DEFAULT_ERROR_HANDLER, DEFAULT_PROGRESS_HANDLER } from 'engine/assets';
import { MainArea } from 'areas/MainArea';
import './styles.css';

// Textures
import BrickColor from 'assets/textures/brick-color.jpg';
import BrickNrm from 'assets/textures/brick-normal.jpg';
import BrickOcc from 'assets/textures/brick-occ.jpg';
import ArchBrickColor from 'assets/textures/arch-bricks-color.jpg';
import ArchBrickNrm from 'assets/textures/arch-bricks-normal.jpg';
import ArchBrickOcc from 'assets/textures/arch-bricks-occ.jpg';
import DirtColor from 'assets/textures/dirt-color.jpg';
import DirtNrm from 'assets/textures/dirt-normal.jpg';
import DirtOcc from 'assets/textures/dirt-occ.jpg';

// Objects
import Arch from 'assets/objects/arch.glb';
import WallTorch from 'assets/objects/wall-torch.glb';

// Images

// Sounds

// Music
import Ambient from 'assets/music/ambient.ogg';

// Fonts
import NumberFont from 'assets/fonts/SpecialElite_Regular.json';

// Build the canvas objects
const gameCanvas = document.createElement('canvas');
document.body.appendChild(gameCanvas);

const overlayCanvas = document.createElement('canvas');
overlayCanvas.setAttribute('tabindex', '0');
overlayCanvas.classList.add('overlay');
document.body.appendChild(overlayCanvas);

const game = new Game(gameCanvas, overlayCanvas);

// Configure the "loading" text
overlayCanvas.width = overlayCanvas.clientWidth;
overlayCanvas.height = overlayCanvas.clientHeight;
const g2d = overlayCanvas.getContext('2d');
g2d.font = '12pt sans-serif';
g2d.fillStyle = 'white';
g2d.textAlign = 'center';
g2d.textBaseline = 'middle';
g2d.fillText('Loading game...', overlayCanvas.width / 2, overlayCanvas.height / 2);

// Show loading progress
let errorOccured = false;
game.assets.progressHandler = (input) => {
  if (!errorOccured) {
    drawLoadingProgress(g2d, input);
  }
  DEFAULT_PROGRESS_HANDLER(input);
};

// Show an error message
game.assets.errorHandler = (input) => {
  errorOccured = true;
  drawLoadingProgress(g2d, input, 'red');
  DEFAULT_ERROR_HANDLER(input);
};

loadAllAssets(game)
  .then((game) => {
    game.start(new MainArea('2'));
  })
  .catch((error) => {
    console.log('Failed to load assets: ' + error, error.stack);
  });

/**
 * Load all of the game assets asynchronously
 */
async function loadAllAssets(game: Game): Promise<Game> {
  await Promise.all([
    game.assets.loadImage('BrickColor', BrickColor),
    game.assets.loadImage('BrickNormal', BrickNrm),
    game.assets.loadImage('BrickOcclusion', BrickOcc),
    game.assets.loadImage('ArchBrickColor', ArchBrickColor),
    game.assets.loadImage('ArchBrickNormal', ArchBrickNrm),
    game.assets.loadImage('ArchBrickOcclusion', ArchBrickOcc),
    game.assets.loadTexture('DirtColor', DirtColor),
    game.assets.loadTexture('DirtNormal', DirtNrm),
    game.assets.loadTexture('DirtOcclusion', DirtOcc),

    game.assets.loadGLTFFile(Arch, (gltf, manager) => {
      manager.saveObject('Arch', gltf.scene.children[0]);
    }),
    game.assets.loadGLTFFile(WallTorch, (gltf, manager) => {
      manager.saveObject('WallTorch', gltf.scene.children[0].children[0]);
    }),

    game.assets.loadAudioFile('Ambient', Ambient),

    game.assets.loadFont('Number', NumberFont),
  ]);

  return game;
}

function drawLoadingProgress(g2d: CanvasRenderingContext2D, text: string, color = 'white'): void {
  g2d.clearRect(0, (5 * overlayCanvas.height) / 8, overlayCanvas.width, (7 * overlayCanvas.height) / 8);
  g2d.fillStyle = color;
  g2d.fillText(text, overlayCanvas.width / 2, (3 * overlayCanvas.height) / 4);
}
