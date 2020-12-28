'use strict';

/**
 * Chip 8 view object.
 *
 * @author Onur Cinar
 */
export class Chip8View {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   */
  constructor(chip8) {
    this.chip8 = chip8;
    this.marked = [];

    chip8.on('step', () => {
      this.unmarkAll();
    });
  }

  /**
   * Unmark the all previously marked views.
   */
  unmarkAll() {
    for (let i = 0; i < this.marked.length; i++) {
      this.marked[i].classList.remove('mark');
    }

    this.marked.length = 0;
  }

  /**
   * Mark the given view.
   *
   * @param {HTMLElement} view view instance.
   */
  mark(view) {
    view.classList.add('mark');
    this.marked.push(view);
  }
}
