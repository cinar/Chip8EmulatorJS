'use strict';

import {Chip8View} from './chip8view.js';
import {toHex} from './helper.js';

/**
 * Instructions view. Display instructions on page.
 *
 * @author Onur Cinar
 */
export class InstructionsView extends Chip8View {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   */
  constructor(chip8) {
    super(chip8);

    this.rows = {};
    this.initTable();

    chip8.on('memory', (begin, count) => {
      this.memoryChanged(begin, count);
    });

    chip8.on('register', (name) => {
      if (name === 'pc') {
        this.pcChanged();
      }
    });
  }

  /**
   * Initializes the instructions table.
   */
  initTable() {
    this.table = document.createElement('table');

    for (let i = 0; i < this.chip8.memory.byteLength; i += 2) {
      const tr = document.createElement('tr');
      if (i === this.prevPC) {
        tr.classList.add('mark');
      }
      this.table.appendChild(tr);
      this.rows[i] = tr;

      const addressTd = document.createElement('td');
      addressTd.innerHTML = toHex(i, 4);
      tr.appendChild(addressTd);

      tr.appendChild(document.createElement('td'));
      tr.appendChild(document.createElement('td'));

      this.updateRow(i);
    }

    document.getElementById('instructions').appendChild(this.table);
  }

  /**
   * Updates instruction at given byte offset.
   *
   * @param {number} byteOffset byte offset.
   */
  updateRow(byteOffset) {
    const row = this.rows[byteOffset];
    const opcode = this.chip8.memory.getUint16(byteOffset, false);

    row.cells[1].innerHTML = toHex(opcode, 4);
    row.cells[2].innerHTML = this.chip8.parseInstruction(opcode).text;
  }

  /**
   * Event handler for the memory changes.
   *
   * @param {number} begin begin index.
   * @param {number} count changed count.
   */
  memoryChanged(begin, count) {
    if (begin % 2 == 0) {
      for (let i = begin; i < begin + count; i += 2) {
        this.updateRow(i);
      }
    }
  }

  /**
   * Event handler for the PC changes.
   */
  pcChanged() {
    const row = this.rows[this.chip8.pc];
    this.mark(row);
    this.table.scrollTop = row.offsetTop - (this.table.clientHeight / 2);
  }
}
