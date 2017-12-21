const Worker = require('role.Worker');
const Builder = require('Builder');
const Spawner = require('role.Spawner');
const Miner = require('role.Miner');
const Tower = require('role.tower');
const RoadPlanner = require('RoadPlanner');
const ExpansionPlanner = require('ExpansionPlanner');
const Scout = require('role.Scout');
const RoomRole = require('role.Room');
const TaskList = require('TaskList');
const Claimer = require('role.Claimer');
const Mule = require('role.Mule');

require('CreepMixin').run();
require('mixin.Room').run();

module.exports.loop = function () {
  // Clean up old memory
  for (var i in Memory.creeps) {
    if (!Game.creeps[i]) {
      delete Memory.creeps[i];
    }
  }
  TaskList.reset();
  // Initialize rooms
  for (var id in Game.rooms) {
    RoomRole.run(Game.rooms[id]);
  }

  // Initialize units
  const units = [];
  for (var name in Game.creeps) {
    var creep = Game.creeps[name];
    if (creep.spawning) {
      continue;
    }

    switch (creep.memory.role) {
    case 'miner':
      units.push(new Miner(creep));
      break;
    case 'mule':
      units.push(new Mule(creep));
      break;
    case 'builder':
      units.push(new Builder(creep));
      break;
    default:
      console.log('Unknown creep role ' + creep.memory.role);
    }

    TaskList.decrementCreepTasks(Game.creeps[name]);
  }

  TaskList.sort();

  for (let id in Game.rooms) {
    ExpansionPlanner.run();
  }

  for (var id in Game.spawns) {
    Spawner.run(Game.spawns[id]);
  }

  units.forEach((unit) => {
    unit.run();
    unit.creep.save();
  });


  for (var name in Game.structures) {
    var structure = Game.structures[name];
    if (structure.structureType === STRUCTURE_TOWER) {
      Tower.tick(structure);
    }
  }

  RoadPlanner.run();

  //    TaskList.report();
}
