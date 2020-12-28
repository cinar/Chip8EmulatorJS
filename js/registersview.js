'use strict';

import {Chip8View} from './chip8view.js';
import {toHex} from './helper.js';

/**
 * Register view. Displays the content of the registers on page.
 *
 * @author Onur Cinar
 */
export class RegistersView extends Chip8View {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   */
  constructor(chip8) {
    super(chip8);

    this.views = {};

    this.initVregistersTable();
    this.initSpecialRegistersTable();

    chip8.on('register', (name, index) => {
      this.changed(name, index);
    });
  }

  /**
   * Initializes V registers table.
   */
  initVregistersTable() {
    const names = [];
    for (let i = 0; i < this.chip8.v.length; i++) {
      names.push('v' + toHex(i, 1));
    }

    this.initTable(names);
  }

  /**
   * Initializes special registers table.
   */
  initSpecialRegistersTable() {
    this.initTable(['i', 'pc', 'sp', 'dt', 'st']);
  }

  /**
   * Initializes a table with the given register names.
   *
   * @param {Array} names register names.
   */
  initTable(names) {
    const table = document.createElement('table');

    const thead = document.createElement('thead');
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    table.appendChild(tbody);

    const tr = document.createElement('tr');
    tbody.appendChild(tr);

    for (let i = 0; i < names.length; i++) {
      const name = names[i];

      const th = document.createElement('th');
      th.innerHTML = name;
      thead.appendChild(th);

      const td = document.createElement('td');
      this.views[name] = td;
      this.update(name, i);
      tr.appendChild(td);
    }

    document.getElementById('registers').appendChild(table);
  }

  /**
   * Update the value of given register.
   *
   * @param {string} name register name.
   * @param {number} index index of V regsiter.
   */
  update(name, index) {
    switch (name) {
      case 'i':
        this.views['i'].innerHTML = toHex(this.chip8.i, 4);
        break;

      case 'pc':
        this.views['pc'].innerHTML = toHex(this.chip8.pc, 3);
        break;

      case 'sp':
        this.views['sp'].innerHTML = toHex(this.chip8.sp, 2);
        break;

      case 'dt':
        this.views['dt'].innerHTML = toHex(this.chip8.dt, 2);
        break;

      case 'st':
        this.views['st'].innerHTML = toHex(this.chip8.st, 2);
        break;

      default:
        this.views['v' + toHex(index, 1)].innerHTML =
            toHex(this.chip8.v[index], 2);
    }
  }

  /**
   * Event handler for register value changes.
   *
   * @param {string} name register name.
   * @param {index} index index of V register.
   */
  changed(name, index) {
    if (name === 'v') {
      this.mark(this.views['v' + toHex(index, 1)]);
    } else {
      this.mark(this.views[name]);
    }
    this.update(name, index);
  }
}
