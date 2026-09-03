import { prefersReducedMotion } from "../util/dom.js";

const BURST_WINDOW_MS = 2800;   // how long new bursts keep appearing
const ANIMATION_MS = 4200;      // earliest the display may tear itself down
const BACKSTOP_MS = ANIMATION_MS + 4000;
const MS_PER_60HZ_FRAME = 1000 / 60;

/** A single spark. Motion is scaled by elapsed time, not by frame count. */
class Particle {
  constructor(x, y, hue) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.4 + Math.random() * 4.4;
    this.x = x;
    this.y = y;
    this.velocityX = Math.cos(angle) * speed;
    this.velocityY = Math.sin(angle) * speed;
    this.radius = 1.8 + Math.random() * 2.6;
    this.life = 1 + Math.random() * 0.6;
    this.color = `hsl(${hue + (Math.random() * 40 - 20)},90%,${58 + Math.random() * 18}%)`;
  }

  get isAlive() {
    return this.life > 0;
  }

  /** @param {number} frames how many 60Hz frames this step is worth */
  advance(frames, drag) {
    this.velocityY += 0.03 * frames; // gravity
    this.velocityX *= drag;
    this.velocityY *= drag;
    this.x += this.velocityX * frames;
    this.y += this.velocityY * frames;
    this.life -= 0.012 * frames;
  }

  draw(context) {
    context.globalAlpha = Math.max(0, Math.min(1, this.life));
    context.fillStyle = this.color;
    context.beginPath();
    context.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    context.fill();
  }
}

/** The celebration over the summary screen. */
export class Fireworks {
  #canvas;
  #context = null;
  #particles = [];
  #frameId = null;
  #backstopId = null;
  #onResize = null;

  constructor(canvas) {
    this.#canvas = canvas;
  }

  launch() {
    this.stop();
    if (prefersReducedMotion()) return;

    this.#canvas.hidden = false;
    this.#context = this.#canvas.getContext("2d");
    this.#onResize = () => this.#resize();
    window.addEventListener("resize", this.#onResize);
    this.#resize();

    const startedAt = performance.now();
    let previousFrameAt = startedAt;
    let lastBurstAt = 0;

    const drawFrame = (now) => {
      const elapsed = now - startedAt;
      // Cap the step so a stalled tab cannot teleport every spark off-screen.
      const frames = Math.min((now - previousFrameAt) / MS_PER_60HZ_FRAME, 3);
      previousFrameAt = now;
      const drag = Math.pow(0.99, frames);

      this.#context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (elapsed < BURST_WINDOW_MS && now - lastBurstAt > 380) {
        lastBurstAt = now;
        this.#addBurst();
        if (Math.random() < 0.5) this.#addBurst();
      }

      const living = [];
      for (const particle of this.#particles) {
        particle.advance(frames, drag);
        if (particle.isAlive) {
          living.push(particle);
          particle.draw(this.#context);
        }
      }
      this.#particles = living;
      this.#context.globalAlpha = 1;

      if (elapsed < ANIMATION_MS || living.length) {
        this.#frameId = requestAnimationFrame(drawFrame);
      } else {
        this.stop();
      }
    };

    this.#frameId = requestAnimationFrame(drawFrame);

    // requestAnimationFrame is paused while the tab is hidden, so a run that
    // ends just before someone tabs away would leave the canvas up until they
    // came back. This backstop does not depend on frames at all.
    this.#backstopId = setTimeout(() => this.stop(), BACKSTOP_MS);
  }

  stop() {
    if (this.#frameId !== null) {
      cancelAnimationFrame(this.#frameId);
      this.#frameId = null;
    }
    if (this.#backstopId !== null) {
      clearTimeout(this.#backstopId);
      this.#backstopId = null;
    }
    if (this.#onResize) {
      window.removeEventListener("resize", this.#onResize);
      this.#onResize = null;
    }
    this.#context?.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    this.#particles = [];
    this.#canvas.hidden = true;
  }

  #addBurst() {
    const x = (0.12 + Math.random() * 0.76) * window.innerWidth;
    const y = (0.12 + Math.random() * 0.5) * window.innerHeight;
    const hue = Math.floor(Math.random() * 360);
    const count = 60 + Math.floor(Math.random() * 34);
    for (let i = 0; i < count; i += 1) this.#particles.push(new Particle(x, y, hue));
  }

  #resize() {
    const ratio = window.devicePixelRatio || 1;
    this.#canvas.width = window.innerWidth * ratio;
    this.#canvas.height = window.innerHeight * ratio;
    this.#canvas.style.width = `${window.innerWidth}px`;
    this.#canvas.style.height = `${window.innerHeight}px`;
    this.#context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}
