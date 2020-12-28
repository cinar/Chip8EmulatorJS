'use strict';

import {Chip8View} from './chip8view.js';
import {toHex} from './helper.js';

/**
 * Memory views. Displays the byte content of the memory
 * as a table.
 *
 * @author Onur Cinar
 */
export class MemoryView extends Chip8View {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   * @param {number} columns column count (default 16).
   */
  constructor(chip8, columns) {
    super(chip8);

    this.memory = chip8.memory;
    this.columns = columns || 16;
    this.views = [];

    this.initTable();

    chip8.on('memory', (begin, count) => {
      this.changed(begin, count);
    });
  }

  /**
   * Initialize table.
   */
  initTable() {
    this.table = document.createElement('table');

    const thead = document.createElement('thead');
    this.table.appendChild(thead);

    const addressTh = document.createElement('th');
    thead.appendChild(addressTh);

    for (let i = 0; i < this.columns; i++) {
      const valueTh = document.createElement('th');
      valueTh.innerHTML = toHex(i, 2);
      thead.appendChild(valueTh);
    }

    const tbody = document.createElement('tbody');
    this.table.appendChild(tbody);

    let tr;
    for (let i = 0; i < this.memory.byteLength; i++) {
      if (i % this.columns == 0) {
        tr = document.createElement('tr');
        tbody.appendChild(tr);

        const addressTd = document.createElement('td');
        addressTd.innerHTML = toHex(i, 3);
        tr.appendChild(addressTd);
      }

      const valueTd = document.createElement('td');
      valueTd.innerHTML = toHex(this.memory.getUint8(i), 2);
      tr.appendChild(valueTd);

      this.views.push(valueTd);
    }

    document.getElementById('memory').appendChild(this.table);
  }

  /**
   * Event handler for the memory changes.
   *
   * @param {number} begin begin index.
   * @param {number} count bytes changed.
   */
  changed(begin, count) {
    for (let i = begin; i < begin + count; i++) {
      const view = this.views[i];
      view.innerHTML = toHex(this.memory.getUint8(i), 2);
      this.mark(view);
    }

    this.table.scrollTop = this.views[begin].offsetTop -
        (this.table.clientHeight / 2);
  }
}
