'use strict';

import {toBinary} from './helper.js';

/** Byte bits. */
const BYTE_BITS = 8;

/**
 * Bit array. Allows getting and setting the individual bits
 * of a large byte array.
 *
 * @author Onur Cinar
 */
export class BitArray {
  /**
   * Constructor.
   *
   * @param {Uint8Array} bytes byte array.
   */
  constructor(bytes) {
    this.bytes = bytes;
  }

  /**
   * Gets the bit length.
   */
  get length() {
    return this.bytes.length * BYTE_BITS;
  }

  /**
   * Gets the byte and bit index from the given index.
   *
   * @param {number} index byte array bit index.
   * @return {Array} byte and bit index.
   */
  static getByteAndBitIndex(index) {
    return [Math.floor(index / BYTE_BITS), index % BYTE_BITS];
  }

  /**
   * Gets bit at index.
   *
   * @param {number} index byte array bit index.
   * @return {boolean} bit value.
   */
  getBit(index) {
    const [byteIndex, bitIndex] = BitArray.getByteAndBitIndex(index);
    return !!((this.bytes[byteIndex] >> (BYTE_BITS - 1 - bitIndex)) & 1);
  }

  /**
   * Sets bit at index.
   *
   * @param {number} index byte array bit index.
   * @param {boolean} value bit value.
   */
  setBit(index, value) {
    const [byteIndex, bitIndex] = BitArray.getByteAndBitIndex(index);

    if (!!value) {
      this.bytes[byteIndex] |= (1 << (BYTE_BITS - 1 - bitIndex));
    } else {
      this.bytes[byteIndex] &= ~(1 << (BYTE_BITS - 1 - bitIndex));
    }
  }

  /**
   * To string.
   *
   * @override
   * @return {string} string value.
   */
  toString() {
    return this.bytes.reduce((result, byte) => result + toBinary(byte), '');
  }
}
