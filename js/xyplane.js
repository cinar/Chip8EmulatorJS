'use strict';

import {BitArray} from './bitarray.js';

/**
 * XY plane of bits.
 *
 * @author Onur Cinar
 */
export class XyPlane {
  /**
   * Constructor.
   *
   * @param {Uint8Array} bytes plane bytes.
   * @param {number} width plane width.
   */
  constructor(bytes, width) {
    this.bits = new BitArray(bytes);
    this.width = width;
  }

  /**
   * Gets the plane height.
   *
   * @return {number} plane height.
   */
  get height() {
    return this.bits.length / this.width;
  }

  /**
   * To bit index from X and Y locations.
   *
   * @param {number} x X location.
   * @param {number} y Y location.
   * @return {number} bit index.
   */
  toBitIndex(x, y) {
    return (y * this.width) + x;
  }

  /**
   * To byte index from X and Y locations.
   *
   * @param {number} x X location.
   * @param {number} y Y location.
   * @return {number} byte index.
   */
  toByteIndex(x, y) {
    return Math.floor(this.toBitIndex(x, y) / 8);
  }

  /**
   * Gets the bit at X and Y locations.
   *
   * @param {number} x X location.
   * @param {number} y Y location.
   * @return {boolean} bit value.
   */
  getBit(x, y) {
    return this.bits.getBit(this.toBitIndex(x, y));
  }

  /**
   * Sets the bit at X and Y locations.
   *
   * @param {number} x X location.
   * @param {number} y Y location.
   * @param {boolean} value bit value.
   */
  setBit(x, y, value) {
    this.bits.setBit(this.toBitIndex(x, y), value);
  }
}
