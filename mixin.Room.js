/*
 * Module code goes here. Use 'module.exports' to export things:
 * module.exports.thing = 'a thing';
 *
 * You can import it from another modules like this:
 * var mod = require('mixin.Room');
 * mod.thing == 'a thing'; // true
 */

module.exports = {
    run: function() {
        Room.prototype.hasAttackers = function() {
            var roomMemory = (this.memory || {});
            
            if (roomMemory.hostileCreeps > 0) {
                return true;
            }
            
            var towers = (roomMemory.hostileStructures || []).filter(
                (type) => type === STRUCTURE_TOWER
            );
            
            return towers.length > 0;
        }
    },
};