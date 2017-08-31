'use strict';
module.exports = defaultValue;

/**
 * @private
 */
function defaultValue(a, b) {
    if (a !== undefined && a !== null) {
        return a;
    }
    return b;
}