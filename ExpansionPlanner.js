const BaseLayout = require('BaseLayout');
const Controllers = require('Controllers');
const Paths = require('Paths');
const Profiler = require('Profiler');
const Rooms = require('Rooms');
const Sources = require('Sources');

var OPPOSITE_DIR = {};
OPPOSITE_DIR[LEFT] = RIGHT;
OPPOSITE_DIR[RIGHT] = LEFT;
OPPOSITE_DIR[TOP] = BOTTOM;
OPPOSITE_DIR[BOTTOM] = TOP;

const MAX_SITES_PER_ROOM = 2;
var EXPLORE_PING = 1000;
var HOSTILE_EXPLORE_PING = 6000;
var MIN_RESERVATION = 4000;

var ExpansionPlanner = {
  getScoutCandidates: function(roomName) {
    if (!Memory.rooms[roomName]) {
      return {};
    }

    var result = {};

    var now = Game.time;
    var exits = Memory.rooms[roomName].exits;
    for (var dir in exits) {
      var data = Memory.rooms[exits[dir]];
      var sinceLastSeen = now - data.lastSeen;
      var diff = ExpansionPlanner.wasRoomHostile(exits[dir])
          ? HOSTILE_EXPLORE_PING
          : EXPLORE_PING;

      if (sinceLastSeen > diff) {
        result[dir] = exits[dir];
      }
    }

    return result;
  },

  findSourceRoom: function(id) {
    for (let roomName in Memory.rooms) {
      let memory = Memory.rooms[roomName];
      if (memory.sources && id in memory.sources) {
        return roomName;
      }
    }

    return null;
  },

  findControllerRoom: function(id) {
    for (let roomName in Memory.rooms) {
      let memory = Memory.rooms[roomName];
      if (memory.controller && memory.controller.id === id) {
        return roomName;
      }
    }

    return null;
  },

  wasRoomHostile: function(roomName) {
    var roomMemory = (Memory.rooms[roomName] || {});
    if (roomMemory.hostileCreeps > 0) {
      return true;
    }

    var towers = (roomMemory.hostileStructures || []).filter(
      (type) => type === STRUCTURE_TOWER
    );

    return towers.length > 0;
  },

  getRoomDevelopmentPlan: function(room) {
    let hasMule = false;
    let hasMiner = false;
    let energyPerTick = 0;

    const sources = room.find(FIND_SOURCES).sort((a, b) => {
      return a.id < b.id ? -1 : 1;
    });

    for (let source of sources) {
      energyPerTick += Sources.getEnergyPerTick(source);
      if (Sources.getMinersFor(source).length) {
        hasMiner = true;
      }
      if (Sources.getMulesFor(source).length) {
        hasMule = true;
      }
    }

    // First, check we've developed all sources in the same room
    // Every source should have at least 1 miner and 1 hauler
    for (let source of sources) {
      if (!Sources.getMinersFor(source, true).length) {
        if (!hasMiner) {
          return {action: 'spawn_minimum_miner', harvestTarget: source.id};
        } else {
          return {action: 'spawn_miner', harvestTarget: source.id};
        }
      } else if (!Sources.getMulesFor(source).length) {
        if (!hasMule) {
          return {action: 'spawn_minimum_mule', haulTarget: source.id};
        }
        return {action: 'spawn_recovery_mule', haulTarget: source.id};
      }
    }

    // Then, full expand out all miners as needed
    for (let source of sources) {
      if (Sources.getRemainingMineSpeed(source) > 1) {
        return {action: 'spawn_miner', harvestTarget: source.id};
      }
      if (Sources.getRemainingMuleSpeed(source) > 1) {
        return {action: 'spawn_mule', haulTarget: source.id};
      }
    }

    // If we are up to the age where we need haulers, let's build them
    const missingReloaders = Rooms.getMissingReloaders(room);
    if (missingReloaders.length) {
      return {action: 'spawn_reloader', quadrant: missingReloaders[0]};
    }

    // Then, check if we have something upgrading the room
    if (Controllers.mustPrioritizeUpgrade(room.controller) &&
        Controllers.getUpgradeSpeed(room.controller) == 0) {
      return {action: 'spawn_upgrader', upgradeTarget: room.controller.id};
    }

    // Then, check if we want to build structures - prioritize unless
    // downgrade is imminent
    const hasBuildSites = Rooms.getBuildTasks(room).length > 0;
    if (!Rooms.getBuilderFor(room) && hasBuildSites) {
      return {action: 'spawn_builder', room: room.name};
    }

    // Then, fully expand out upgrade speed
    if (room.controller &&
        !hasBuildSites &&
        energyPerTick - Controllers.getUpgradeSpeed(room.controller) > 2) {
      return {action: 'spawn_upgrader', upgradeTarget: room.controller.id};
    }

    // if (room.controller.level >= 4) {
    //   var candidates = ExpansionPlanner.getScoutCandidates(room.name);
    //   if (Object.keys(candidates).length) {
    //     var hasScout = false;
    //     for (var creepName in creeps) {
    //       hasScout = creeps[creepName].memory.role === 'scout';
    //       if (hasScout) {
    //         break;
    //       }
    //     }
    //     if (!hasScout) {
    //       return {action: 'spawn_scout'};
    //     }
    //   }
    // }

    // Check if we need to claim other rooms
    // if (room.energyCapacityAvailable >= 1250) {
    //   for (let sourceID in miners) {
    //     let source = Game.getObjectById(sourceID);
    //     if (source &&
    //         source.room.controller &&
    //         !source.room.controller.owner &&
    //         !(source.room.controller.id in claimers)) {
    //       let reservation = source.room.controller.reservation;
    //       if (!reservation ||
    //           (reservation.username === 'dougli' && reservation.ticksToEnd < MIN_RESERVATION)) {
    //         return {action: 'spawn_claimer', claimTarget: source.room.controller.id};
    //       }
    //     }
    //   }
    // }

    return {};
  },

  getRoomMemory: function(room) {
    var now = Game.time;
    if (room.memory && room.memory.lastSeen > 0) {
      return room.memory;
    }

    room.find(FIND_SOURCES).sort((a, b) => {
      return a.id < b.id ? -1 : 1;
    }).forEach((source) => Sources.getMemoryFor(source));

    // Configure exits
    var exits = Game.map.describeExits(room.name);
    room.memory.exits = exits;
    room.memory.lastSeen = Game.time;

    for (var direction in exits) {
      var exitName = exits[direction];
      if (!Memory.rooms[exitName]) {
        Memory.rooms[exitName] = {lastSeen: 0};
      }

      if (!Memory.rooms[exitName].exits) {
        Memory.rooms[exitName].exits = {};
      }
      Memory.rooms[exitName].exits[OPPOSITE_DIR[direction]] = room.name;
    }

    return room.memory;
  },

  run: function(room) {
    const now = Game.time;
    var memory = ExpansionPlanner.getRoomMemory(room);

    if (!room.controller || !room.controller.my) {
      Object.assign(memory, ExpansionPlanner._getLiveStats(room));
    } else if (now % 10 === 0) {
      ExpansionPlanner.buildBase(room);
    }

    memory.lastSeen = now;
  },

  buildBase: function(room) {
    const sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    let numToBuild = MAX_SITES_PER_ROOM - sites.length;
    if (numToBuild <= 0) {
      return;
    }

    // Fully build out the base at the current level
    let plans = BaseLayout.getConstructionPlans(room);
    ExpansionPlanner._buildPlans(room, plans, numToBuild);
  },

  _buildPlans: function(room, plans, numToBuild) {
    if (!plans) {
      return false;
    }

    for (const plan of plans) {
      if (room.createConstructionSite(plan.x, plan.y, plan.type) === OK) {
        numToBuild--;
        if (numToBuild <= 0) {
          break;
        }
      }
    }
    return plans.length > 0;
  },

  _getLiveStats: function(room) {
    var creeps = room.find(FIND_HOSTILE_CREEPS);

    var hostileCreeps = creeps.filter((creep) => {
      return creep.body.some((part) => (
        part === ATTACK || part === RANGED_ATTACK || part === HEAL
      ));
    }).length;

    var neutralCreeps = creeps.length - hostileCreeps;

    var hostileStructures = room.find(FIND_HOSTILE_STRUCTURES)
        .map((structure) => structure.structureType);

    var controller = null;
    if (room.controller) {
      controller = {
        id: room.controller.id,
        owner: room.controller.owner,
        level: room.controller.level,
        progress: room.controller.progress,
        reservation: room.controller.reservation,
        ticksToDowngrade: room.controller.ticksToDowngrade,
      };
    }

    return {
      neutralCreeps, hostileCreeps, hostileStructures, controller,
    };
  },
}

Profiler.registerObject(ExpansionPlanner, 'ExpansionPlanner');

module.exports = ExpansionPlanner;
