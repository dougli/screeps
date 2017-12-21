var ExpansionPlanner = require('ExpansionPlanner');


var Scout = {
    run: function(creep) {
        creep.notifyWhenAttacked(false);
        
        var currentRoom = creep.room;
        var scoutTarget = creep.memory.scoutTarget;
        if (currentRoom.hasAttackers()) {
            creep.say('Oops!', true);
            var closestExit = creep.pos.findClosestByPath(FIND_EXIT);
            creep.moveTo(exit);
            return;
        } else if (!scoutTarget || currentRoom.name === scoutTarget) {
            delete creep.memory.scoutTarget;
            
            // Improve this code for when we have more than 1 spawn
            var spawns = Game.spawns;
            var spawn = null;
            for (var spawnName in spawns) {
                spawn = spawns[spawnName];
                break;
            }
            
            var candidates = ExpansionPlanner.getScoutCandidates(
                spawn.room.name
            );
            
            for (var dir in candidates) {
                scoutTarget = candidates[dir];
                creep.memory.scoutTarget = scoutTarget;
                break;
            }
        }
        
        if (currentRoom.name != scoutTarget) {
            var route = Game.map.findRoute(currentRoom, scoutTarget);
            
            if (route !== ERR_NO_PATH) {
                var exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        }
    },
}

module.exports = Scout;