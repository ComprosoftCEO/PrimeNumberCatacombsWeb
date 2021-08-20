import { MainArea } from 'areas/MainArea';
import { TitleArea } from 'areas/TitleArea';
import { FadeOutEffect } from './FadeOutEffect';

/**
 * Animation for when you are trapped in a room
 */
export class DeadEndAnimation extends FadeOutEffect {
  constructor() {
    super(10, 0.05, 30 * 5);
  }

  protected onTick(alpha: number): void {
    const mainArea = this.entity.area.state as MainArea;
    mainArea.ambient.volume = 1 - alpha;
  }

  protected onFinish(): void {
    const mainArea = this.entity.area.state as MainArea;
    mainArea.ambient.stop();

    this.entity.area.game.setArea(new TitleArea());
  }
}
