var Worker = require('role.Worker');
var Spawner = require('role.Spawner');
var Miner = require('role.Miner');
var Tower = require('role.tower');
var RoadPlanner = require('RoadPlanner');
var ExpansionPlanner = require('ExpansionPlanner');
var Scout = require('role.Scout');
var RoomRole = require('role.Room');
var TaskList = require('TaskList');
var Claimer = require('role.Claimer');
var Mule = require('role.Mule');

require('CreepMixin').run();
require('mixin.Room').run();

module.exports.loop = function () {
    for (var i in Memory.creeps) {
        if (!Game.creeps[i]) {
            delete Memory.creeps[i];
        }
    }

    TaskList.reset();
    for (var id in Game.rooms) {
        RoomRole.run(Game.rooms[id]);
    }
    for (var name in Game.creeps) {
        TaskList.decrementCreepTasks(Game.creeps[name]);
    }
    TaskList.sort();

    ExpansionPlanner.run();

    for (var id in Game.spawns) {
        Spawner.run(Game.spawns[id]);
    }

    for(var name in Game.creeps) {
        var creep = Game.creeps[name];
        if (creep.spawning) {
            continue;
        }

        switch (creep.memory.role) {
            case 'worker':
                Worker.run(creep);
                break;
            case 'miner':
                Miner.run(creep);
                break;
            case 'scout':
                Scout.run(creep);
                break;
            case 'claimer':
                Claimer.run(creep);
                break;
            case 'mule':
                Mule.run(creep);
                break;
            default:
                console.log('Unknown creep role ' + creep.memory.role);
        }

        creep.save();
    }


    for (var name in Game.structures) {
        var structure = Game.structures[name];
        if (structure.structureType === STRUCTURE_TOWER) {
            Tower.tick(structure);
        }
    }

    RoadPlanner.run();

//    TaskList.report();
}
