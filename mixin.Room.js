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
