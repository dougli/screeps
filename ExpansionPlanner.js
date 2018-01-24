const BaseLayout = require('BaseLayout');
const Builder = require('role.Builder');
const Controllers = require('Controllers');
const Defender = require('role.Defender');
const Miner = require('role.Miner');
const Mission = require('Mission');
const Mule = require('role.Mule');
const Profiler = require('Profiler');
const Reloader = require('role.Reloader');
const Repairer = require('role.Repairer');
const Rooms = require('Rooms');
const Sources = require('Sources');
const Upgrader = require('role.Upgrader');
const Walls = require('Walls');

const MAX_SITES_PER_ROOM = 4;

var Spawner = {
  spawnMinimumMiner: function(spawn, plan) {
    if (spawn.room.energyAvailable < 400 ||
        Spawner.spawnMiner(spawn, plan) !== OK) {
      return spawn.spawnCreep(
        [MOVE, CARRY, WORK],
        Math.random().toString(16).substring(2),
        {memory: {
          role: 'miner',
          harvestTarget: plan.harvestTarget,
          harvestRoom: plan.harvestRoom,
        }});
    }
  },

  spawnMiner: function(spawn, plan) {
    return spawn.spawnCreep(
      Miner.getIdealBuild(spawn.room.energyCapacityAvailable),
      Math.random().toString(16).substring(2),
      {memory: {
        role: 'miner',
        harvestTarget: plan.harvestTarget,
        harvestRoom: plan.harvestRoom,
        mission: plan.mission,
        missionKey: plan.key,
      }});
  },

  spawnMule: function(spawn, plan, minimum = false) {
    const sourcePos = Sources.getSourcePosition(plan.haulRoom, plan.haulTarget);
    if (!sourcePos) {
      return null;
    }

    const parts = minimum
          ? [MOVE, CARRY]
          : Mule.getIdealBuild(plan.base, sourcePos, 10);
    return spawn.spawnCreep(
      parts,
      Math.random().toString(16).substring(2),
      {memory: {
        role: 'mule',
        haulTarget: plan.haulTarget,
        haulRoom: plan.haulRoom,
        base: plan.base,
        mission: plan.mission,
        missionKey: plan.key,
      }});
  },

  spawnRecoveryMule: function(spawn, plan) {
    const result = Spawner.spawnMule(spawn, plan, false);
    if (result === OK) {
      return OK;
    }

    return spawn.spawnCreep(
      [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
      Math.random().toString(16).substring(2),
      {memory: {
        role: 'mule',
        haulTarget: plan.haulTarget,
        haulRoom: plan.haulRoom,
        base: plan.base,
        mission: plan.mission,
        missionKey: plan.key,
      }});
  },

  spawnReloader: function(spawn, quadrant) {
    return spawn.createCreep(
      Reloader.getIdealBuild(spawn.room),
      undefined,
      {role: 'reloader', quadrant}
    );
  },

  spawnUpgrader: function(spawn, upgradeTarget) {
    return spawn.createCreep(
      Upgrader.getIdealBuild(spawn.room.energyCapacityAvailable),
      undefined,
      {role: 'upgrader', upgradeTarget});
  },

  spawnBuilder: function(spawn, room) {
    return spawn.createCreep(
      Builder.getIdealBuild(spawn.room.energyCapacityAvailable),
      undefined,
      {role: 'builder', room});
  },

  spawnRepairer: function(spawn, room) {
    return spawn.createCreep(
      Repairer.getIdealBuild(spawn.room.energyCapacityAvailable),
      undefined,
      {role: 'repairer', room});
  },

  spawnScout: function(spawn, mission, missionKey) {
    return spawn.createCreep(
      [MOVE],
      undefined,
      {role: 'scout', mission, missionKey}
    );
  },

  spawnClaimer: function(spawn, mission, missionKey) {
    return spawn.createCreep(
      [MOVE, MOVE, CLAIM, CLAIM],
      undefined,
      {role: 'claimer', mission, missionKey}
    );
  },

  spawnDefender: function(spawn, plan) {
    return spawn.spawnCreep(
      Defender.getIdealBuild(spawn.room.energyCapacityAvailable),
      Math.random().toString(16).substring(2),
      {memory: {
        role: 'defender',
        defendTarget: plan.defendTarget,
        mission: plan.mission,
        missionKey: plan.key,
      }});
  },

  spawnByPlan: function(spawn, plan) {
    if (plan.action == 'spawn_miner') {
      Spawner.spawnMiner(spawn, plan);
    } else if (plan.action == 'spawn_minimum_miner') {
      Spawner.spawnMinimumMiner(spawn, plan);
    } else if (plan.action == 'spawn_mule') {
      Spawner.spawnMule(spawn, plan);
    } else if (plan.action == 'spawn_minimum_mule') {
      Spawner.spawnMule(spawn, plan, true);
    } else if (plan.action == 'spawn_recovery_mule') {
      Spawner.spawnRecoveryMule(spawn, plan);
    } else if (plan.action == 'spawn_reloader') {
      Spawner.spawnReloader(spawn, plan.quadrant);
    } else if (plan.action == 'spawn_upgrader') {
      Spawner.spawnUpgrader(spawn, plan.upgradeTarget);
    } else if (plan.action == 'spawn_builder') {
      Spawner.spawnBuilder(spawn, plan.room);
    } else if (plan.action == 'spawn_repairer') {
      Spawner.spawnRepairer(spawn, plan);
    } else if (plan.action == 'spawn_scout') {
      Spawner.spawnScout(spawn, plan.mission, plan.key);
    } else if (plan.action == 'spawn_claimer') {
      Spawner.spawnClaimer(spawn, plan.mission, plan.key);
    } else if (plan.action == 'spawn_defender') {
      Spawner.spawnDefender(spawn, plan);
    }
  }
};

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
    if (!room.controller || !room.controller.my) {
      return;
    }

    const spawn = room.find(FIND_MY_SPAWNS).filter(spawn => !spawn.spawning)[0];
    if (spawn) {
      const plan = ExpansionPlanner.getRoomDevelopmentPlan(room);
      Spawner.spawnByPlan(spawn, plan);
    }

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

Profiler.registerObject(Spawner, 'Spawner');
Profiler.registerObject(ExpansionPlanner, 'ExpansionPlanner');

module.exports = ExpansionPlanner;
