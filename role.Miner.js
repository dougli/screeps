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
    var site = null;
    if (!container) {
      site = Sources.getContainerSiteFor(source);
      if (!site) {
        sourceMemory.containerSite = this._constructContainerFor(source);
      }
    }

    var transferred = false;
    if (!container) {
      var nearbyNoobs = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
        filter: function(other) {
          const task = other.tasks[0];
          return other.memory.role === 'mule' &&
            task &&
            task.type === Task.PICKUP;
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

    if (!transferred && creep.carry.energy > 0 && container && container.hits < container.hitsMax) {
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

  _constructContainerFor(source) {
    var spaces = [];

    var pos = source.pos;
    for (var ii = -1; ii <= 1; ii++) {
      for (var jj = -1; jj <= 1; jj++) {
        var x = pos.x + ii;
        var y = pos.y + jj;
        if (x <= 0 || x >= 49 || y <= 0 || y >= 49) {
          continue;
        }
        var roomPos = new RoomPosition(x, y, pos.roomName);
        var terrain = roomPos.lookFor(LOOK_TERRAIN);
        if (terrain == 'plain') {
          spaces.push(roomPos);
        }
      }
    }

    var spawn = source.room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_SPAWN}
    })[0];

    var best = null;
    var bestNearby = null;
    for (var ii = 0; ii < spaces.length; ii++) {
      var nearby = 0;
      for (var jj = 0; jj < spaces.length; jj++) {
        nearby += spaces[ii].isNearTo(spaces[jj]) ? 1 : 0;
      }

      if (!best || nearby > bestNearby) {
        best = spaces[ii];
        bestNearby = nearby;
      } else if (nearby === bestNearby && spawn) {
        var distance = spaces[ii].findPathTo(
          spawn,
          {ignoreCreeps: true, ignoreRoads: true}
        ).length;

        var bestDistance = best.findPathTo(
          spawn,
          {ignoreCreeps: true, ignoreRoads: true}
        ).length;

        if (distance < bestDistance) {
          best = spaces[ii];
          bestNearby = nearby;
        }
      }
    }

    best.createConstructionSite(STRUCTURE_CONTAINER);
    return {x: best.x, y: best.y};
  }
}

Profiler.registerClass(Miner, 'Miner');

module.exports = Miner;
