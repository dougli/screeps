const BuildCosts = require('BuildCosts');
const ExpansionPlanner = require('ExpansionPlanner');
const Task = require('Task');

class Miner {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, WORK, WORK],
      capacity
    );
  }

  constructor(creep) {
    this.creep = creep;
  }

  getMineSpeed() {
    return this.creep.getActiveBodyparts(WORK) * 2;
  }

  run() {
    const creep = this.creep;

    var source = Game.getObjectById(creep.memory.harvestTarget);
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


    var sourceMemory = ExpansionPlanner.getRoomMemory(source.room).sources[source.id];
    var container = Game.getObjectById(sourceMemory.container);
    var site = null;
    if (!container) {
      if (sourceMemory.containerSite) {
        var coords = sourceMemory.containerSite;
        var pos = new RoomPosition(coords.x, coords.y, creep.room.name);
        container = pos.findInRange(
          FIND_STRUCTURES,
          0,
          {filter: {structureType: STRUCTURE_CONTAINER}}
        )[0];
        if (container) {
          sourceMemory.container = container.id;
          delete sourceMemory.containerSite;
        } else {
          site = pos.findInRange(
            FIND_CONSTRUCTION_SITES,
            0,
            {filter: {structureType: STRUCTURE_CONTAINER}}
          )[0];
        }
      }

      if (!site) {
        sourceMemory.containerSite = this._constructContainerFor(source);
      }
    }


    var transferred = false;
    var nearbyNoobs = creep.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter: function(creep) {
        const task = creep.tasks[0];
        return creep.memory.role === 'worker' &&
          task &&
          task.type === Task.WAIT_PICKUP &&
          task.target.id === source.id
      }
    });
    if (nearbyNoobs.length > 0) {
      var maxTransfer = Math.min(
        creep.carry.energy,
        nearbyNoobs[0].carryCapacity - nearbyNoobs[0].carry.energy
      );
      transferred = ExpansionPlanner.transferMinedToCreep(creep, nearbyNoobs[0], maxTransfer) === OK;
    } else if (container && container.hits == container.hitsMax) {
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

module.exports = Miner;
