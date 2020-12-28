'use strict';

/**
 * Converts the given number to hex.
 *
 * @param {number} value number value.
 * @param {number} minDigits minimum digits.
 * @return {string} hex value.
 */
export function toHex(value, minDigits) {
  let pading = '';
  for (let i = 0; i < minDigits; i++) {
    pading += '0';
  }

  return (pading + value.toString(16)).substr(-minDigits);
}

/**
 * Converts the given number to binary.
 *
 * @param {number} byte byte value.
 * @return {string} binary value.
 */
export function toBinary(byte) {
  return ('0000000' + byte.toString(2)).substr(-8);
}
