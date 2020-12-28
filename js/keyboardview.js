'use strict';

import {toHex} from './helper.js';

/**
 * Keyboard view. Machine keyboard.
 *
 * @author Onur Cinar
 */
export class KeyboardView {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   */
  constructor(chip8) {
    this.chip8 = chip8;

    this.initKeyboard();
  }

  /**
   * Initializes keyboard.
   */
  initKeyboard() {
    const keys = [
      0x1, 0x2, 0x3, 0xC,
      0x4, 0x5, 0x6, 0xD,
      0x7, 0x8, 0x9, 0xE,
      0xA, 0x0, 0xB, 0xF,
    ];

    const table = document.createElement('table');
    const self = this;

    let tr;
    for (let i = 0; i < keys.length; i++) {
      if (i % 4 === 0) {
        tr = document.createElement('tr');
        table.appendChild(tr);
      }

      const td = document.createElement('td');
      tr.appendChild(td);

      const button = document.createElement('button');
      button.innerText = toHex(keys[i], 1).toUpperCase();
      button.addEventListener('mousedown', () => {
        self.chip8.press(keys[i]);
      });
      button.addEventListener('mouseup', () => {
        self.chip8.press(undefined);
      });
      button.addEventListener('touchstart', (event) => {
        self.chip8.press(keys[i]);
        event.preventDefault();
      });
      button.addEventListener('touchend', (event) => {
        self.chip8.press(undefined);
        event.preventDefault();
      });

      td.appendChild(button);
    }

    document.getElementById('keyboard').appendChild(table);
  }
}
