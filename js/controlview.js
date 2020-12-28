'use strict';

import {GAMES_CH8} from './rom.js';

/**
 * Control view. Machine controls.
 *
 * @author Onur Cinar
 */
export class ControlView {
  /**
   * Constructor.
   *
   * @param {Chip8} chip8 chip8 instance.
   */
  constructor(chip8) {
    this.chip8 = chip8;
    this.controls = document.getElementById('controls');
    this.description = document.getElementById('description');
    this.views = {};

    this.initGames();
    this.initButtons();

    this.enable(['Games', 'Load']);
  }

  /**
   * Initializes the game selection.
   */
  initGames() {
    const select = document.createElement('select');
    for (let i = 0; i < GAMES_CH8.length; i++) {
      const game = GAMES_CH8[i];

      const option = document.createElement('option');
      option.innerText = game.name;
      select.appendChild(option);
    }

    this.controls.appendChild(select);
    this.views['Games'] = select;
  }

  /**
   * Initializes the control buttons.
   */
  initButtons() {
    const self = this;
    const actions = [
      {
        name: 'Load',
        run: () => {
          self.load();
        },
      },
      {
        name: 'Step',
        run: () => {
          self.step();
        },
      },
      {
        name: 'Start',
        run: () => {
          self.start();
        },
      },
      {
        name: 'Stop',
        run: () => {
          self.stop();
        },
      },
      {
        name: 'Reset',
        run: () => {
          self.reset();
        },
      },
    ];

    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];

      const button = document.createElement('button');
      button.innerText = action.name;
      button.addEventListener('click', action.run);
      this.controls.appendChild(button);
      this.views[action.name] = button;
    }
  }

  /**
   * Enable given list of views and disable the other ones.
   *
   * @param {Array} enabled enabled names.
   */
  enable(enabled) {
    const enabledNames = new Set(enabled);
    for (const [name, value] of Object.entries(this.views)) {
      value.disabled = !enabledNames.has(name);
    }
  }

  /**
   * Loads the selected game.
   */
  load() {
    const game = GAMES_CH8[this.views['Games'].selectedIndex];
    this.description.innerHTML = game.description;
    this.chip8.loadProgramFromUrl(game.code);
    this.enable(['Step', 'Start', 'Reset']);
  }

  /**
   * Steps to next instruction.
   */
  step() {
    this.chip8.step();
  }

  /**
   * Starts emulator.
   */
  start() {
    this.chip8.start();
    this.enable(['Stop']);
  }

  /**
   * Stops emulator.
   */
  stop() {
    this.chip8.stop();
    this.enable(['Step', 'Start', 'Reset']);
  }

  /**
   * Resets emulator.
   */
  reset() {
    this.chip8.reset();
    this.enable(['Games', 'Load']);
  }
}
