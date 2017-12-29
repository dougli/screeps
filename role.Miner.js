const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const ExpansionPlanner = require('ExpansionPlanner');
const Sources = require('Sources');
const Task = require('Task');
const Profiler = require('Profiler');

class Miner extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK],
      capacity);
  }

  constructor(creep) {
    super(creep);
    const source = this.getMineSource();
    if (source) {
      source.miners = source.miners || [];
      source.miners.push(this);
    }
  }

  getMineSource() {
    return Game.getObjectById(this.creep.memory.harvestTarget);
  }

  getMineSpeed() {
    return this.creep.getActiveBodyparts(WORK) * 2;
  }

  run() {
    const creep = this.creep;

    var source = this.getMineSource();
    if (!source) {
      // Find room of source
      const roomName = ExpansionPlanner.findSourceRoom(creep.memory.harvestTarget);
      if (!roomName) {
        creep.suicide();
        return;
      }
      const exitDir = Game.map.findExit(creep.room, roomName);
      const exit = creep.pos.findClosestByRange(exitDir);
      creep.moveToWithTrail(exit);
      return;
    }

    var container = Sources.getContainerFor(source);
    let site = null;
    if (!container) {
      site = Sources.getContainerSiteFor(source);
    }

    var transferred = false;
    if (!container) {
      var nearbyNoobs = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: function(other) {
          return other.memory.role === 'mule';
        }
      });
      if (nearbyNoobs.length > 0) {
        var maxTransfer = Math.min(
          creep.carry.energy,
          nearbyNoobs[0].carryCapacity - nearbyNoobs[0].carry.energy
        );
        transferred = ExpansionPlanner.transferMinedToCreep(creep, nearbyNoobs[0], maxTransfer) === OK;
      }
    } else if (container.hits == container.hitsMax) {
      transferred = creep.transfer(container, RESOURCE_ENERGY, creep.carry.energy) === OK;
    }

    if (!transferred &&
        creep.carry.energy > 0 &&
        container &&
        container.hits < container.hitsMax) {
      creep.repair(container);
    } else if (!creep.carry.energy || creep.carry.energy < creep.carryCapacity - this.getMineSpeed()) {
      var harvestResult = creep.harvest(source);
      if (harvestResult == ERR_NOT_IN_RANGE) {
        creep.moveToWithTrail(source);
      }
    } else if (!container && site) {
      creep.build(site);
    } else if (container) {
      creep.moveToWithTrail(container);
      creep.transfer(container, RESOURCE_ENERGY, creep.carry.energy);
    }
  }
}

Profiler.registerClass(Miner, 'Miner');

module.exports = Miner;
