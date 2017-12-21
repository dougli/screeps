/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('pickOne');
 * mod.thing == 'a thing'; // true
 */

module.exports = function(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
};