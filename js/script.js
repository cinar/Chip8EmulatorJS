'use strict';

import {Chip8} from './chip8.js';
import {ControlView} from './controlview.js';
import {DisplayView} from './displayview.js';
import {KeyboardView} from './keyboardview.js';
import {MemoryView} from './memoryview.js';
import {RegistersView} from './registersview.js';
import {InstructionsView} from './instructionsview.js';

const chip8 = new Chip8();
new ControlView(chip8);
new DisplayView(chip8);
new KeyboardView(chip8);
new MemoryView(chip8);
new RegistersView(chip8);
new InstructionsView(chip8);
