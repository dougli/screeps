const BaseLayout = require('BaseLayout');
const Walls = require('Walls');
const Controllers = require('Controllers');
const Mission = require('Mission');
const Profiler = require('Profiler');
const Rooms = require('Rooms');
const Sources = require('Sources');

const MAX_SITES_PER_ROOM = 4;

var ExpansionPlanner = {
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
          return {
            action: 'spawn_minimum_miner',
            harvestTarget: source.id,
            harvestRoom: room.name
          };
        } else {
          return {
            action: 'spawn_miner',
            harvestTarget: source.id,
            harvestRoom: room.name
          };
        }
      } else if (!Sources.getMulesFor(source).length) {
        if (!hasMule) {
          return {
            action: 'spawn_minimum_mule',
            haulTarget: source.id,
            haulRoom: room.name,
            base: room.name
          };
        }
        return {
          action: 'spawn_recovery_mule',
          haulTarget: source.id,
          haulRoom: room.name,
          base: room.name
        };
      }
    }

    // Then, full expand out all miners as needed
    for (let source of sources) {
      if (Sources.getRemainingMineSpeed(source) > 1) {
        return {
          action: 'spawn_miner',
          harvestTarget: source.id,
          harvestRoom: room.name
        };
      }
      if (Sources.getRemainingMuleSpeed(source) > 1) {
        return {
          action: 'spawn_mule',
          haulTarget: source.id,
          haulRoom: room.name,
          base: room.name
        };
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

    // Make sure we have builders or repairers as needed
    const hasBuildSites = Rooms.getBuildTasks(room).length > 0;
    if (!Rooms.getBuilderFor(room) && hasBuildSites) {
      return {action: 'spawn_builder', room: room.name};
    }

    const hasRepairSites = Rooms.getRepairerTasks(room).length > 0;
    const hasWallSites = Rooms.getBuildDefenseTasks(room).length > 0;
    if (!Rooms.getRepairerFor(room) &&
        (hasRepairSites || hasWallSites) &&
        room.storage) {
      return {action: 'spawn_repairer', room: room.name};
    }

    // Then, fully expand out upgrade speed
    if (room.controller &&
        !hasBuildSites &&
        (Controllers.getContainerFor(room.controller) || upgradeSpeed === 0) &&
        energyPerTick - upgradeSpeed > 2) {
      return {action: 'spawn_upgrader', upgradeTarget: room.controller.id};
    }

    // Finally, fulfill any mission requisitions
    const requisition = Mission.getCreepRequisitions()[0];
    if (requisition && requisition.type === 'scout') {
      return {
        action: 'spawn_scout',
        mission: requisition.mission.id,
        key: requisition.key
      };
    } else if (requisition && requisition.type === 'claimer') {
      return {
        action: 'spawn_claimer',
        mission: requisition.mission.id,
        key: requisition.key
      };
    } else if (requisition && requisition.type === 'miner') {
      return {
        action: 'spawn_miner',
        mission: requisition.mission.id,
        key: requisition.key,
        harvestTarget: requisition.memory.harvestTarget,
        harvestRoom: requisition.memory.harvestRoom
      };
    } else if (requisition && requisition.type === 'mule') {
      return {
        action: 'spawn_mule',
        mission: requisition.mission.id,
        key: requisition.key,
        haulTarget: requisition.memory.haulTarget,
        haulRoom: requisition.memory.haulRoom,
        base: requisition.memory.base
      };
    } else if (requisition && requisition.type === 'defender') {
      return {
        action: 'spawn_defender',
        mission: requisition.mission.id,
        key: requisition.key,
        defendTarget: requisition.memory.defendTarget,
      };
    }

    return {};
  },

  run: function(room) {
    if (Game.time % 11 === 0) {
      ExpansionPlanner.buildBase(room);
    }
  },

  buildBase: function(room) {
    if (!room.controller || !room.controller.my) {
      return;
    }

    let sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    let numToBuild = MAX_SITES_PER_ROOM - sites.length;
    if (numToBuild <= 0) {
      return;
    }

    // Fully build out the base at the current level
    let plans = BaseLayout.getConstructionPlans(room);
    ExpansionPlanner._buildPlans(room, plans, numToBuild);

    sites = room.find(FIND_MY_CONSTRUCTION_SITES);
    numToBuild = MAX_SITES_PER_ROOM - sites.length;
    if (numToBuild <= 0) {
      return;
    }

    plans = Walls.getWallPlansToBuild(room);
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
