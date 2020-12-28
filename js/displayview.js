'use strict';

// TODO: Use CSS.
const BACKGROUND_COLOR = '#202330';
const FOREGROUND_COLOR = '#d4d4d4';

/**
 * Display view. Machine display.
 *
 * @author Onur Cinar
 */
export class DisplayView {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   */
  constructor(chip8) {
    this.chip8 = chip8;
    this.scaler = 10;

    this.initCanvas();

    chip8.on('display', (x, y, n) => {
      this.refresh(x, y, n);
    });

    chip8.on('clear', () => {
      this.clear();
    });
  }

  /**
   * Initializes the display canvas.
   */
  initCanvas() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.chip8.DISPLAY_WIDTH * this.scaler;
    this.canvas.height = this.chip8.DISPLAY_HEIGHT * this.scaler;

    document.getElementById('display').appendChild(this.canvas);
    this.context = this.canvas.getContext('2d');
  }

  /**
   * Refreshes the machine display.
   *
   * @param {number} x X location.
   * @param {number} y Y location.
   * @param {number} n draw height.
   */
  refresh(x, y, n) {
    for (let i = 0; i < n; i++) {
      const yPos = y + i;
      for (let j = 0; j < 8; j++) {
        const xPos = x + j;
        const bit = this.chip8.display.getBit(xPos, yPos);

        this.context.fillStyle = (bit) ? FOREGROUND_COLOR : BACKGROUND_COLOR;
        this.context.fillRect(
            xPos * this.scaler, yPos * this.scaler,
            this.scaler, this.scaler);
      }
    }
  }

  /**
   * Clears the machine display.
   */
  clear() {
    this.context.fillStyle = BACKGROUND_COLOR;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
