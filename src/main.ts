import * as Arbitrage from 'Arbitrage';
import * as CreepMixin from 'CreepMixin';
import * as ExpansionPlanner from 'ExpansionPlanner';
import * as MissionLoader from 'MissionLoader';
import * as Overseer from 'Overseer';
import * as Profiler from 'Profiler';
import { Builder } from 'role.Builder';
import { Claimer } from 'role.Claimer';
import { Defender } from 'role.Defender';
import { ErrorMapper } from 'utils/ErrorMapper';
import { Miner } from 'role.Miner';
import { Mule } from 'role.Mule';
import { Reloader } from 'role.Reloader';
import { Repairer } from 'role.Repairer';
import { Scout } from 'role.Scout';
import { Tower } from 'role.Tower';
import { Upgrader } from 'role.Upgrader';

CreepMixin.run();

Profiler.enable();

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  Profiler.wrap(() => {
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
      case 'repairer':
        units.push(new Repairer(creep));
        break;
      case 'upgrader':
        units.push(new Upgrader(creep));
        break;
      case 'scout':
        units.push(new Scout(creep));
        break;
      case 'claimer':
        units.push(new Claimer(creep));
        break;
      case 'defender':
        units.push(new Defender(creep));
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
      Arbitrage.run(Game.rooms[id]);
    }

    units.forEach((unit) => {
      if (unit.isSpawning()) {
        return;
      }

      unit.run();
      unit.creep.save();
    });

    structures.forEach(structure => structure.run());
  });
});
