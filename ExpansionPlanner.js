const BaseLayout = require('BaseLayout');
const Controllers = require('Controllers');
const Paths = require('Paths');
const Profiler = require('Profiler');
const Rooms = require('Rooms');
const Sources = require('Sources');
const Mission = require('Mission');

var OPPOSITE_DIR = {};
OPPOSITE_DIR[LEFT] = RIGHT;
OPPOSITE_DIR[RIGHT] = LEFT;
OPPOSITE_DIR[TOP] = BOTTOM;
OPPOSITE_DIR[BOTTOM] = TOP;

const MAX_SITES_PER_ROOM = 4;
var MIN_RESERVATION = 4000;

var ExpansionPlanner = {
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
    const upgradeSpeed = Controllers.getUpgradeSpeed(room.controller);
    const missingReloaders = Rooms.getMissingReloaders(room);
    if (missingReloaders.length) {
      return {action: 'spawn_reloader', quadrant: missingReloaders[0]};
    }

    // Then, check if we have something upgrading the room
    if (Controllers.mustPrioritizeUpgrade(room.controller) &&
        upgradeSpeed === 0) {
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
        (Controllers.getContainerFor(room.controller) || upgradeSpeed === 0) &&
        energyPerTick - upgradeSpeed > 2) {
      return {action: 'spawn_upgrader', upgradeTarget: room.controller.id};
    }

    // Finally, fulfill any mission requisitions
    const requisitions = Mission.getCreepRequisitions();
    if (requisitions.length && requisitions[0].type === 'scout') {
      return {action: 'spawn_scout', mission: requisitions[0].mission.id};
    }

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

  run: function(room) {
    if (Game.time % 10 === 0) {
      ExpansionPlanner.buildBase(room);
    }
  },

  buildBase: function(room) {
    if (!room.controller || !room.controller.my) {
      return;
    }

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
}

Profiler.registerObject(ExpansionPlanner, 'ExpansionPlanner');

module.exports = ExpansionPlanner;
