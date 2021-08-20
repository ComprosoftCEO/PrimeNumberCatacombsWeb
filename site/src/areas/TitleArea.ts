import { Area, AreaState } from 'engine/area';
import { Entity } from 'engine/entity';
import { FadeInEffect } from 'entities/effects/FadeInEffect';
import { ArchGroup } from 'entities/layout/ArchGroup';
import { TorchEntity } from 'entities/layout/TorchEntity';
import { MazeFloor } from 'entities/layout/MazeFloor';
import { MazeCamera } from 'entities/MazeCamera';
import { DoorSelectorArea } from './DoorSelectorArea';
import { MainArea } from './MainArea';

enum Timer {
  TestForMovement,
}

/**
 * Title Screen for the Game
 */
export class TitleArea implements AreaState, DoorSelectorArea {
  public readonly smallestIndex = 0;
  public readonly largestIndex = 0;

  private area: Area<this>;
  private camera: MazeCamera;
  private hideText = false;

  onCreate(area: Area<this>): void {
    this.area = area;

    this.area.createEntity(new MazeFloor());
    this.area.createEntity(new ArchGroup([{ relativePosition: 0 }]));

    this.camera = new MazeCamera();
    this.area.createEntity(this.camera);

    this.area.createEntity(new FadeInEffect());
    this.area.setTimer(Timer.TestForMovement, 11, true);
  }

  public movedTo(index: number): void {
    for (const entity of this.area.findEntities('torch-entity') as Entity<TorchEntity>[]) {
      entity.state.setTorchPosition(index);
    }
  }

  public canEnterDoor(index: number): boolean {
    return index === 0;
  }

  /**
   * Action fired when the door is entered
   */
  enterDoor(_index: number): void {
    this.area.game.setArea(new MainArea('2'));
  }

  onDispose(): void {}

  onTimer(timerIndex: number): void {
    switch (timerIndex) {
      case Timer.TestForMovement:
        this.area.setTimer(Timer.TestForMovement, 1, true);
        if (this.camera.isMoving) {
          this.hideText = true;
        }
        break;
    }
  }

  onStep(): void {}

  onDraw(g2d: CanvasRenderingContext2D): void {
    if (this.hideText) {
      return;
    }

    // Draw the title text
    g2d.font = 'bold 36pt "Special Elite"';
    g2d.textAlign = 'center';
    g2d.textBaseline = 'top';
    g2d.fillStyle = '#9c7300';
    g2d.fillText('Prime Number Catacombs', this.area.overlayWidth / 2, 20);

    // Draw the outline
    g2d.beginPath();
    g2d.strokeStyle = 'black';
    g2d.lineWidth = 0.01;
    g2d.strokeText('Prime Number Catacombs', this.area.overlayWidth / 2, 20);
    g2d.stroke();

    // Draw the "Created By"
    g2d.font = '14pt sans-serif';
    g2d.fillStyle = '#dddddd';

    const metrics = g2d.measureText('Created by Bryan McClain');
    g2d.fillText(
      'Created by Bryan McClain',
      this.area.overlayWidth / 2,
      this.area.overlayHeight - 2 * metrics.actualBoundingBoxDescent,
    );
  }
}
