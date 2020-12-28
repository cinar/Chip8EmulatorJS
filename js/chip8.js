'use strict';

import {BitArray} from './bitarray.js';
import {Emitter} from './emitter.js';
import {XyPlane} from './xyplane.js';
import {toHex} from './helper.js';

const FONT_CH8 = new Uint8Array([
  0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
  0x20, 0x60, 0x20, 0x20, 0x70, // 1
  0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
  0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
  0x90, 0x90, 0xF0, 0x10, 0x10, // 4
  0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
  0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
  0xF0, 0x10, 0x20, 0x40, 0x40, // 7
  0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
  0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
  0xF0, 0x90, 0xF0, 0x90, 0x90, // A
  0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
  0xF0, 0x80, 0x80, 0x80, 0xF0, // C
  0xE0, 0x90, 0x90, 0x90, 0xE0, // D
  0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
  0xF0, 0x80, 0xF0, 0x80, 0x80, // F
]);

/**
 * Chip 8 machine emulator.
 *
 * @autor Onur Cinar
 */
export class Chip8 extends Emitter {
  /**
   * Constructor.
   */
  constructor() {
    super();

    // 0x000 - 0x1FF Interpreter
    // 0x200 - 0xEBF Program
    // 0xEA0 - 0xEFF Internal
    // 0xF00 - 0xFFF Display
    this.MEMORY_SIZE = 4096;

    this.PROGRAM_OFFSET = 0x200;
    this.PROGRAM_END = 0xEBF;
    this.PROGRAM_SIZE = this.PROGRAM_END - this.PROGRAM_OFFSET + 1;

    this.STACK_OFFSET = 0xEA0;
    this.STACK_SIZE = 16 * 2;

    this.DISPLAY_OFFSET = 0xF00;
    this.DISPLAY_END = 0xFFF;
    this.DISPLAY_SIZE = this.DISPLAY_END - this.DISPLAY_OFFSET + 1;
    this.DISPLAY_WIDTH = 64;
    this.DISPLAY_HEIGHT = 32;
    this.TIMER_CYCLE = 2;

    this.buffer = new ArrayBuffer(this.MEMORY_SIZE);
    this.memory = new DataView(this.buffer);
    this.display = new XyPlane(
        new Uint8Array(this.buffer, this.DISPLAY_OFFSET, this.DISPLAY_SIZE),
        this.DISPLAY_WIDTH);
    this.v = new Uint8Array(16);
    this.i = 0;
    this.sp = 0;
    this.pc = 0;
    this.dt = 0;
    this.st = 0;
    this.cycle = 0;

    this.setMemory(FONT_CH8, 0);
  }

  /**
   * Resets emulator.
   */
  reset() {
    this.setMemory(0, 0, this.MEMORY_SIZE);
    this.clearDisplay();
    this.setMemory(FONT_CH8, 0);
    for (let i = 0; i < this.v.length; i++) {
      this.setV(i, 0);
    }
    this.setI(0);
    this.setSP(0);
    this.setPC(0);
    this.setDT(0);
    this.setST(0);
    this.cycle = 0;
  }

  /**
   * Loads the program from the URL.
   *
   * @param {string} url program URL.
   * @return {Promise} load promise.
   */
  loadProgramFromUrl(url) {
    return fetch(url)
        .then((result) => result.arrayBuffer())
        .then((buffer) => this.loadProgramFromBytes(new Uint8Array(buffer)))
        .catch((e) => console.log(e));
  }

  /**
   * Loads the program from the bytes.
   *
   * @param {Uint8Array} bytes program bytes.
   */
  loadProgramFromBytes(bytes) {
    if (bytes.byteLength > this.PROGRAM_SIZE) {
      throw new Error(
          `Program size ${bytes.byteLength} larger than available.`);
    }
    this.setMemory(bytes, this.PROGRAM_OFFSET);
    this.setPC(this.PROGRAM_OFFSET);
  }

  /**
   * Sets the memory at given offset.
   *
   * @param {Uint8Array} bytes bytes array.
   * @param {number} offset set from the offset.
   * @param {number} length bytes length.
   */
  setMemory(bytes, offset, length) {
    if (bytes.byteLength !== undefined) {
      length = length || bytes.byteLength;
      for (let i = 0; i < length; i++) {
        this.memory.setUint8(offset + i, bytes[i]);
      }
    } else {
      length = length || 1;
      for (let i = 0; i < length; i++) {
        this.memory.setUint8(offset + i, bytes);
      }
    }

    this.emit('memory', offset, length);
  }

  /**
   * Sets the PC register.
   *
   * @param {number} address instruction address.
   */
  setPC(address) {
    this.pc = address;
    this.emit('register', 'pc');
  }

  /**
   * Sets the I register.
   *
   * @param {number} address memory address.
   */
  setI(address) {
    this.i = address;
    this.emit('register', 'i');
  }

  /**
   * Sets the stack pointer.
   *
   * @param {number} offset stack offset.
   */
  setSP(offset) {
    this.sp = offset;
    this.emit('register', 'sp');
  }

  /**
   * Sets the V register.
   *
   * @param {number} index register index.
   * @param {number} value register value.
   */
  setV(index, value) {
    this.v[index] = value;
    this.emit('register', 'v', index);
  }

  /**
   * Sets the delay timer.
   *
   * @param {number} value set value.
   */
  setDT(value) {
    this.dt = value;
    this.emit('register', 'dt');
  }

  /**
   * Sets the sound timer.
   *
   * @param {number} value set value.
   */
  setST(value) {
    this.st = value;
    this.emit('register', 'st');
  }

  /**
   * Dump V registers to the address at the I register.
   *
   * @param {number} n first V register index.
   */
  regDump(n) {
    for (let i = 0; i <= n; i++) {
      this.memory.setUint8(this.i + i, this.v[i]);
    }
  }

  /**
   * Loads V registers from the address at the I register.
   *
   * @param {number} n first V register index.
   */
  regLoad(n) {
    for (let i = 0; i <= n; i++) {
      this.setV(i, this.memory.getUint8(this.i + i));
    }
  }

  /**
   * Address of next PC.
   *
   * @return {number} next PC.
   */
  nextPC() {
    return this.pc + 2;
  }

  /**
   * Address of skip PC.
   *
   * @return {number} skip PC.
   */
  skipPC() {
    return this.pc + 4;
  }

  /**
   * Random value.
   *
   * @return {number} random value.
   */
  rand() {
    return Math.floor(Math.random() * 256);
  }

  /**
   * Push the instruction address to stack.
   *
   * @param {number} address instruction address.
   */
  pushStack(address) {
    if (this.sp === this.STACK_SIZE) {
      throw new Error('Stack overflow');
    }

    const offset = this.STACK_OFFSET + this.sp;
    this.memory.setUint16(offset, address);
    this.emit('memory', offset, 2);

    this.setSP(this.sp + 2);
  }

  /**
   * Pops the instruction address from stack.
   *
   * @return {number} instruction address.
   */
  popStack() {
    if (this.sp === 0) {
      throw new Error('Stack empty');
    }

    this.setSP(this.sp - 2);

    const offset = this.STACK_OFFSET + this.sp;
    const address = this.memory.getUint16(offset);
    this.memory.setUint16(offset, 0);
    this.emit('memory', offset, 2);

    return address;
  }

  /**
   * Key pressed.
   *
   * @param {number} key key pressed.
   */
  press(key) {
    this.key = key;
  }

  /**
   * Clear display.
   */
  clearDisplay() {
    this.setMemory(0, this.DISPLAY_OFFSET, this.DISPLAY_SIZE);
    this.emit('clear');
  }

  /**
   * Step to next instruction.
   */
  step() {
    this.emit('step');

    const opcode = this.memory.getUint16(this.pc);
    const instruction = this.parseInstruction(opcode);

    const nextPC = instruction.run() || this.nextPC();
    this.setPC(nextPC);

    this.cycle = (this.cycle + 1) % this.TIMER_CYCLE;
    if (this.cycle === 0) {
      if (this.dt !== 0) {
        this.setDT(this.dt - 1);
      }

      if (this.st !== 0) {
        this.setST(this.st - 1);
      }
    }
  }

  /**
   * Start emulator.
   */
  start() {
    this.interval = setInterval(() => {
      this.step();
    }, 1000 / 200);
  }

  /**
   * Stop emulator.
   */
  stop() {
    clearInterval(this.interval);
    this.interval = undefined;
  }

  /**
   * Parse instruction.
   *
   * @param {number} opcode opcode value.
   * @return {object} instruction value.
   */
  parseInstruction(opcode) {
    if (opcode === 0x00E0) {
      // Clears the screen.
      return {
        opcode: '00E0',
        text: 'disp_clear()',
        run: () => {
          this.clearDisplay();
        },
      };
    } else if (opcode === 0x00EE) {
      // Returns from a subroutine.
      return {
        opcode: '00EE',
        text: 'return',
        run: () => {
          return this.popStack();
        },
      };
    } else if ((opcode & 0xF000) === 0x0000) {
      // Calls machine code routine (RCA 1802 for COSMAC VIP)
      // at address NNN. Not necessary for most ROMs.
      const nnn = opcode & 0x0FFF;
      return {
        opcode: '0NNN',
        text: 'call ' + toHex(nnn, 3),
        run: () => {
          return nnn;
        },
      };
    } else if ((opcode & 0xF000) === 0x1000) {
      // Jumps to address NNN.
      const nnn = opcode & 0x0FFF;
      return {
        opcode: '1NNN',
        text: `goto ${toHex(nnn, 3)}`,
        run: () => {
          return nnn;
        },
      };
    } else if ((opcode & 0xF000) === 0x2000) {
      // Calls subroutine at NNN.
      const nnn = opcode & 0x0FFF;
      return {
        opcode: '2NNN',
        text: `*(${toHex(nnn, 3)})()`,
        run: () => {
          this.pushStack(this.nextPC());
          return nnn;
        },
      };
    } else if ((opcode & 0xF000) === 0x3000) {
      // Skips the next instruction if VX equals NN.
      const x = (opcode & 0x0F00) >>> 8;
      const nn = opcode & 0x00FF;
      return {
        opcode: '3XNN',
        text: `if (v${toHex(x, 1)} == ${toHex(nn, 2)})`,
        run: () => {
          if (this.v[x] === nn) {
            return this.skipPC();
          }
        },
      };
    } else if ((opcode & 0xF000) === 0x4000) {
      // Skips the next instruction if VX doesn't equal NN.
      const x = (opcode & 0x0F00) >>> 8;
      const nn = opcode & 0x00FF;
      return {
        opcode: '4XNN',
        text: `if (v${toHex(x, 1)} != ${toHex(nn, 2)})`,
        run: () => {
          if (this.v[x] !== nn) {
            return this.skipPC();
          }
        },
      };
    } else if ((opcode & 0xF00F) === 0x5000) {
      // Skips the next instruction if VX equals VY.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '5XY0',
        text: `if (v${toHex(x, 1)} != v${toHex(y, 1)})`,
        run: () => {
          if (this.v[x] === this.v[y]) {
            return this.skipPC();
          }
        },
      };
    } else if ((opcode & 0xF000) === 0x6000) {
      // Sets VX to NN.
      const x = (opcode & 0x0F00) >>> 8;
      const nn = opcode & 0x00FF;
      return {
        opcode: '6XNN',
        text: `v${toHex(x, 1)} = ${toHex(nn, 2)}`,
        run: () => {
          this.setV(x, nn);
        },
      };
    } else if ((opcode & 0xF000) === 0x7000) {
      // Adds NN to VX. (Carry flag is not changed)
      const x = (opcode & 0x0F00) >>> 8;
      const nn = opcode & 0x00FF;
      return {
        opcode: '7XNN',
        text: `v${toHex(x, 1)} += ${toHex(nn, 2)}`,
        run: () => {
          this.setV(x, this.v[x] + nn);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8000) {
      // Sets VX to the value of VY.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY0',
        text: `v${toHex(x, 1)} = v${toHex(y, 1)}`,
        run: () => {
          this.setV(x, this.v[y]);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8001) {
      // Sets VX to VX or VY.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY1',
        text: `v${toHex(x, 1)} = v${toHex(x, 1)} | v${toHex(y, 1)}`,
        run: () => {
          this.setV(x, this.v[x] | this.v[y]);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8002) {
      // Sets VX to VX and VY.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY2',
        text: `v${toHex(x, 1)} = v${toHex(x, 1)} & v${toHex(y, 1)}`,
        run: () => {
          this.setV(x, this.v[x] & this.v[y]);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8003) {
      // Sets VX to VX xor VY.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY3',
        text: `v${toHex(x, 1)} = v${toHex(x, 1)} ^ v${toHex(y, 1)}`,
        run: () => {
          this.setV(x, this.v[x] ^ this.v[y]);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8004) {
      // Adds VY to VX. VF is set to 1 when there's a carry,
      // and to 0 when there isn't.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY4',
        text: `v${toHex(x, 1)} += v${toHex(y, 1)}`,
        run: () => {
          const value = this.v[x] + this.v[y];
          this.setV(0xf, value > 0xFF);
          this.setV(x, value & 0xFF);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8005) {
      // VY is subtracted from VX. VF is set to 0 when
      // there's a borrow, and 1 when there isn't.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY5',
        text: `v${toHex(x, 1)} -= v${toHex(y, 1)}`,
        run: () => {
          const value = this.v[x] - this.v[y];
          this.setV(0xf, value > 0);
          this.setV(x, value & 0xFF);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8006) {
      // Stores the least significant bit of VX in VF
      // and then shifts VX to the right by 1.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: '8XY6',
        text: `v${toHex(x, 1)} >>= 1`,
        run: () => {
          this.setV(0xf, this.v[x] & 0x1);
          this.setV(x, this.v[x] >>> 1);
        },
      };
    } else if ((opcode & 0xF00F) === 0x8007) {
      // Sets VX to VY minus VX. VF is set to 0 when
      // there's a borrow, and 1 when there isn't.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '8XY7',
        text: `v${toHex(x, 1)} = v${toHex(y, 1)} - v${toHex(x, 1)}`,
        run: () => {
          const value = this.v[y] - this.v[x];
          this.setV(0xf, value > 0);
          this.setV(x, value & 0xFF);
        },
      };
    } else if ((opcode & 0xF00F) === 0x800E) {
      // Stores the most significant bit of VX in VF
      // and then shifts VX to the left by 1.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: '8XYE',
        text: `v${toHex(x, 1)} <<= 1`,
        run: () => {
          this.setV(0xf, this.v[x] >>> 7);
          this.setV(x, this.v[x] << 1);
        },
      };
    } else if ((opcode & 0xF00F) === 0x9000) {
      // Skips the next instruction if VX doesn't equal VY.
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      return {
        opcode: '9XY0',
        text: `if (v${toHex(x, 1)} != v${toHex(y, 1)})`,
        run: () => {
          if (this.v[x] !== this.v[y]) {
            return this.skipPC();
          }
        },
      };
    } else if ((opcode & 0xF000) === 0xA000) {
      // Sets I to the address NNN.
      const nnn = opcode & 0x0FFF;
      return {
        opcode: 'ANNN',
        text: `I = ${toHex(nnn, 3)}`,
        run: () => {
          this.setI(nnn);
        },
      };
    } else if ((opcode & 0xF000) === 0xB000) {
      // Jumps to the address NNN plus V0.
      const nnn = opcode & 0x0FFF;
      return {
        opcode: 'BNNN',
        text: `PC = V0 + ${toHex(nnn, 3)}`,
        run: () => {
          return this.v[0] + nnn;
        },
      };
    } else if ((opcode & 0xF000) === 0xC000) {
      // Sets VX to the result of a bitwise and operation on
      // a random number (Typically: 0 to 255) and NN.
      const x = (opcode & 0x0F00) >>> 8;
      const nn = opcode & 0x00FF;
      return {
        opcode: 'CXNN',
        text: `v${toHex(x, 1)} = rand() & ${toHex(nn, 2)}`,
        run: () => {
          this.setV(x, this.rand() & nn);
        },
      };
    } else if ((opcode & 0xF000) === 0xD000) {
      // Draws a sprite at coordinate (VX, VY) that has a width of 8
      // pixels and a height of N+1 pixels. Each row of 8 pixels is
      // read as bit-coded starting from memory location I; I value
      // doesn’t change after the execution of this instruction. As
      // described above, VF is set to 1 if any screen pixels are
      // flipped from set to unset when the sprite is drawn, and
      // to 0 if that doesn’t happen
      const x = (opcode & 0x0F00) >>> 8;
      const y = (opcode & 0x00F0) >>> 4;
      const n = opcode & 0x000F;
      return {
        opcode: 'DXYN',
        text: `draw(v${toHex(x, 1)}, v${toHex(y, 1)}, ${toHex(n, 1)})`,
        run: () => {
          const xLoc = this.v[x];
          const yLoc = this.v[y];
          let collusion = 0;

          const row = new BitArray(new Uint8Array(1));
          for (let i = 0; i < n; i++) {
            const yPos = (yLoc + i) % this.DISPLAY_HEIGHT;
            row.bytes[0] = this.memory.getUint8(this.i + i);
            for (let j = 0; j < 8; j++) {
              const xPos = (xLoc + j) % this.DISPLAY_WIDTH;
              const prevBit = this.display.getBit(xPos, yPos);
              const bit = row.getBit(j);

              this.display.setBit(xPos, yPos, prevBit ^ bit);

              collusion = (prevBit && bit) ? 1 : collusion;
            }

            const beginByteIndex = this.display.toByteIndex(xLoc, yPos);
            const endByteIndex = this.display.toByteIndex(xLoc + 8, yPos);
            this.emit('memory',
                this.DISPLAY_OFFSET + beginByteIndex,
                endByteIndex - beginByteIndex);
          }

          this.setV(0xF, collusion);
          this.emit('display', xLoc, yLoc, n);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xE09E) {
      // Skips the next instruction if the key stored in VX is pressed.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'EX9E',
        text: `if (key() == v${toHex(x, 1)})`,
        run: () => {
          if (this.key === this.v[x]) {
            return this.skipPC();
          }
        },
      };
    } else if ((opcode & 0xF0FF) === 0xE0A1) {
      // Skips the next instruction if the key stored in VX isn't pressed.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'EXA1',
        text: `if (key() != v${toHex(x, 1)})`,
        run: () => {
          if (this.key !== this.v[x]) {
            return this.skipPC();
          }
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF007) {
      // Sets VX to the value of the delay timer.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX07',
        text: `v${toHex(x, 1)} = get_delay()`,
        run: () => {
          this.setV(x, this.dt);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF00A) {
      // A key press is awaited, and then stored in VX. (Blocking
      // Operation. All instruction halted until next key event)
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX0A',
        text: `v${toHex(x, 1)} = get_key()`,
        run: () => {
          const key = this.key;
          if (key === undefined) {
            return this.pc;
          } else {
            this.v[x] = key;
          }
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF015) {
      // Sets the delay timer to VX.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX15',
        text: `delay_timer(v${toHex(x, 1)})`,
        run: () => {
          this.setDT(this.v[x]);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF018) {
      // Sets the sound timer to VX.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX18',
        text: `sound_timer(v${toHex(x, 1)})`,
        run: () => {
          this.setST(this.v[x]);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF01E) {
      // Adds VX to I. VF is not affected.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX1E',
        text: `I += v${toHex(x, 1)}`,
        run: () => {
          this.setI(this.i + this.v[x]);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF029) {
      // Sets I to the location of the sprite for the character
      // in VX. Characters 0-F (in hexadecimal) are represented
      // by a 4x5 font.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX29',
        text: `I = sprite_addr[v${toHex(x, 1)}]`,
        run: () => {
          this.setI(this.v[x] * 5);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF033) {
      // Stores the binary-coded decimal representation of VX, with the most
      // significant of three digits at the address in I, the middle digit
      // at I plus 1, and the least significant digit at I plus 2. (In
      // other words, take the decimal representation of VX, place the
      // hundreds digit in memory at location in I, the tens digit at
      // location I+1, and the ones digit at location I+2.)
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX33',
        text: `set_BCD(v${toHex(x, 1)})`,
        run: () => {
          let value = this.v[x];
          this.memory.setUint8(this.i, Math.floor(value / 100));
          value %= 100;

          this.memory.setUint8(this.i + 1, Math.floor(value / 10));
          value %= 10;

          this.memory.setUint8(this.i + 2, value);
          this.emit('memory', this.i, 3);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF055) {
      // Stores V0 to VX (including VX) in memory starting at address I.
      // The offset from I is increased by 1 for each value written, but
      // I itself is left unmodified.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX55',
        text: `reg_dump(v${toHex(x, 1)}, &I)`,
        run: () => {
          this.regDump(x);
        },
      };
    } else if ((opcode & 0xF0FF) === 0xF065) {
      // Fills V0 to VX (including VX) with values from memory starting
      // at address I. The offset from I is increased by 1 for each
      // value written, but I itself is left unmodified.
      const x = (opcode & 0x0F00) >>> 8;
      return {
        opcode: 'FX65',
        text: `reg_load(v${toHex(x, 1)}, &I)`,
        run: () => {
          this.regLoad(x);
        },
      };
    } else {
      return {
        opcode: toHex(opcode, 4),
        text: '',
        run: () => {

        },
      };
    }
  }
}
