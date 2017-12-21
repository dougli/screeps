const ExpansionPlanner = require('ExpansionPlanner');

const Claimer = {
    run: function(creep) {
        const id = creep.memory.claimTarget;
        const target = Game.getObjectById(id);
        if (!target) {
            const roomName = ExpansionPlanner.findControllerRoom(id);
            if (!roomName) {
                creep.suicide();
                return;
            }
            const exitDir = Game.map.findExit(creep.room, roomName);
            const exit = creep.pos.findClosestByRange(exitDir);
            creep.moveTo(exit);
            return;
        }
        
        switch (creep.reserveController(target)) {
            case ERR_NOT_IN_RANGE:
                creep.moveTo(target);
                return;
            case ERR_NO_BODYPART:
                creep.suicide();
        }
    },
}

module.exports = Claimer;