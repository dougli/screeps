const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const ExpansionPlanner = require('ExpansionPlanner');
const Sources = require('Sources');
const Task = require('Task');
const Profiler = require('Profiler');

class Miner extends BaseUnit {
  static getIdealBuild(capacity) {
    // Miners need 6 work parts instead of just 5 because it spends some time
    // repairing containers and/or walking
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, WORK, MOVE, WORK, WORK],
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

    const container = Sources.getContainerFor(source);
    const canCarryMore =
          creep.carry.energy <= (creep.carryCapacity - this.getMineSpeed());
    // 1. Repair if possible - we assume the miner is nearby since it will not
    // have energy if it didn't mine, which it needs to walk to
    if (creep.carry.energy > 0 && container && container.hits < container.hitsMax) {
      creep.repair(container);
      return; // Creeps cannot repair and mine at the same time
    }

    // 2. Mine if we have enough empty capacity
    if (canCarryMore) {
      if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
        creep.moveToWithTrail(source);
      }
    }

    // 3. Transfer to container or, if none, nearby mules
    if (creep.carry.energy > 0) {
      if (container) {
        const result = creep.transfer(container, RESOURCE_ENERGY, creep.carry.energy);
        if (result === ERR_NOT_IN_RANGE && !canCarryMore) {
          creep.moveToWithTrail(container);
        }
      } else {
        const nearbyMule = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
          filter: (other) => other.memory.role === 'mule',
        })[0];

        if (nearbyMule) {
          var maxTransfer = Math.min(
            creep.carry.energy,
            nearbyMule.carryCapacity - nearbyMule.carry.energy
          );
          creep.transfer(nearbyMule, RESOURCE_ENERGY, maxTransfer);
        }
      }
    }

    // 4. Build container
    if (!container && !canCarryMore) {
      const site = Sources.getContainerSiteFor(source);
      site && creep.build(site);
    }
  }
}

Profiler.registerClass(Miner, 'Miner');

module.exports = Miner;
