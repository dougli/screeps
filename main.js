const Builder = require('role.Builder');
const Claimer = require('role.Claimer');
const ExpansionPlanner = require('ExpansionPlanner');
const Miner = require('role.Miner');
const Mule = require('role.Mule');
const Profiler = require('Profiler');
const RoadPlanner = require('RoadPlanner');
const RoomRole = require('role.Room');
const Scout = require('role.Scout');
const Spawner = require('role.Spawner');
const TaskList = require('TaskList');
const Tower = require('role.tower');
const Upgrader = require('role.Upgrader');
const BaseLayout = require('BaseLayout');

require('CreepMixin').run();
require('mixin.Room').run();

Profiler.enable();

module.exports.loop = function () {
  Profiler.wrap(_ => {
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
      case 'upgrader':
        units.push(new Upgrader(creep));
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

    BaseLayout.drawBase(16, 16, 6, true, 'W8N3');
    // RoadPlanner.run();
    // TaskList.report();
  });
}
