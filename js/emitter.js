'use strict';

/**
 * Event emitter.
 *
 * @author Onur Cinar
 */
export class Emitter {
  /**
   * Constructor.
   */
  constructor() {
    this.events = {};
  }

  /**
   * On event. Calls the listener function when the given
   * event occurs.
   *
   * @param {string} event event name.
   * @param {function} listener listener function.
   */
  on(event, listener) {
    const handler = this.events[event];
    if (handler === undefined) {
      this.events[event] = listener;
    } else if (typeof handler === 'function') {
      this.events[event] = [handler, listener];
    } else {
      handler.push(listener);
    }
  }

  /**
   * Emit event. Emits the event to the listeners.
   *
   * @param {string} event event name.
   * @param {any} args event arguments.
   */
  emit(event, ...args) {
    const handler = this.events[event];
    if (handler !== undefined) {
      if (typeof handler === 'function') {
        handler(...args);
      } else {
        handler.forEach((listener) => listener(...args));
      }
    }
  }
}
