const Builder = require('role.Builder');
const Claimer = require('role.Claimer');
const ExpansionPlanner = require('ExpansionPlanner');
const Miner = require('role.Miner');
const MissionLoader = require('MissionLoader');
const Mule = require('role.Mule');
const Overseer = require('Overseer');
const Profiler = require('Profiler');
const Reloader = require('role.Reloader');
const Scout = require('role.Scout');
const Spawner = require('role.Spawner');
const Tower = require('role.Tower');
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

    MissionLoader.loadAll();

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
      case 'reloader':
        units.push(new Reloader(creep));
        break;
      case 'builder':
        units.push(new Builder(creep));
        break;
      case 'upgrader':
        units.push(new Upgrader(creep));
        break;
      case 'scout':
        units.push(new Scout(creep));
        break;
      default:
        console.log('Unknown creep role ' + creep.memory.role);
      }
    }

    const structures = [];
    for (var name in Game.structures) {
      var structure = Game.structures[name];
      if (structure.structureType === STRUCTURE_TOWER) {
        structures.push(new Tower(structure));
      }
    }

    Overseer.run();

    for (let id in Game.missions) {
      Game.missions[id].run();
    }

    for (let id in Game.rooms) {
      ExpansionPlanner.run(Game.rooms[id]);
    }

    for (var id in Game.spawns) {
      Spawner.run(Game.spawns[id]);
    }

    units.forEach((unit) => {
      unit.run();
      unit.creep.save();
    });

    structures.forEach(structure => structure.run());
  });
}
