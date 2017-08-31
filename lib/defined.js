'use strict';
module.exports = defined;

/**
 * @private
 */
function defined(value) {
    return value !== undefined && value !== null;
}