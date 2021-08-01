import { compute_catacombs } from 'prime-number-catacombs';
import image from 'assets/catacombs.png';
import Two from 'two.js';
import './styles.css';

console.log(compute_catacombs('13333333333'));
console.log(Two);

const elem = document.getElementById('canvas');
const two: Two = new Two({ fullscreen: true });
two.appendTo(elem);

const circle = new Two.Circle(200, 0, 15);
circle.fill = '#FF8000';

const texture = new Two.Texture(image);
const sprite = new Two.Sprite(texture);
sprite.translation.x = 200;
two.scene.add(sprite);
two.scene.add(circle);

setInterval(() => {
  two.update();
}, 1000);
