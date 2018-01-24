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
};

var ExpansionPlanner = {
  spawnCreep: function(room, spawn) {
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
        const plan = {
          harvestTarget: source.id,
          harvestRoom: room.name
        };

        if (!hasMiner) {
          Spawner.spawnMinimumMiner(spawn, plan);
        } else {
          Spawner.spawnMiner(spawn, plan);
        }
        return;
      } else if (!Sources.getMulesFor(source).length) {
        if (!hasMule) {
          Spawner.spawnMule(spawn, {
            haulTarget: source.id,
            haulRoom: room.name,
            base: room.name
          }, true);
        } else {
          Spawner.spawnRecoveryMule(spawn, {
            haulTarget: source.id,
            haulRoom: room.name,
            base: room.name
          });
        }
        return;
      }
    }

    // Then, full expand out all miners as needed
    for (let source of sources) {
      if (Sources.getRemainingMineSpeed(source) > 1) {
        Spawner.spawnMiner(spawn, {
          harvestTarget: source.id,
          harvestRoom: room.name
        });
        return;
      }
      if (Sources.getRemainingMuleSpeed(source) > 1) {
        Spawner.spawnMule(spawn, {
          haulTarget: source.id,
          haulRoom: room.name,
          base: room.name
        });
        return;
      }
    }

    // If we are up to the age where we need haulers, let's build them
    const upgradeSpeed = Controllers.getUpgradeSpeed(room.controller);
    const missingReloaders = Rooms.getMissingReloaders(room);
    if (missingReloaders.length) {
      Spawner.spawnReloader(spawn, missingReloaders[0]);
      return;
    }

    // Then, check if we have something upgrading the room
    if (Controllers.mustPrioritizeUpgrade(room.controller) &&
        upgradeSpeed === 0) {
      Spawner.spawnUpgrader(spawn, room.controller.id);
      return;
    }

    // Make sure we have builders or repairers as needed
    const hasBuildSites = Rooms.getBuildTasks(room).length > 0;
    if (!Rooms.getBuilderFor(room) && hasBuildSites) {
      Spawner.spawnBuilder(spawn, {room: room.name});
      return;
    }

    const hasRepairSites = Rooms.getRepairerTasks(room).length > 0;
    const hasWallSites = Rooms.getBuildDefenseTasks(room).length > 0;
    if (!Rooms.getRepairerFor(room) &&
        (hasRepairSites || hasWallSites) &&
        room.storage) {
      Spawner.spawnRepairer(spawn, room.name);
      return;
    }

    // Then, fully expand out upgrade speed
    if (room.controller &&
        !hasBuildSites &&
        (Controllers.getContainerFor(room.controller) || upgradeSpeed === 0) &&
        energyPerTick - upgradeSpeed > 2) {
      Spawner.spawnUpgrader(spawn, room.controller.id);
      return;
    }

    // Finally, fulfill any mission requisitions
    const requisition = Mission.getCreepRequisitions()[0];
    if (requisition && requisition.type === 'scout') {
      Spawner.spawnScout(spawn, requisition.mission.id, requisition.key);
    } else if (requisition && requisition.type === 'claimer') {
      Spawner.spawnClaimer(spawn, requisition.mission.id, requisition.key);
    } else if (requisition && requisition.type === 'miner') {
      Spawner.spawnMiner(spawn, {
        mission: requisition.mission.id,
        key: requisition.key,
        harvestTarget: requisition.memory.harvestTarget,
        harvestRoom: requisition.memory.harvestRoom
      })
    } else if (requisition && requisition.type === 'mule') {
      Spawner.spawnMule(spawn, {
        mission: requisition.mission.id,
        key: requisition.key,
        haulTarget: requisition.memory.haulTarget,
        haulRoom: requisition.memory.haulRoom,
        base: requisition.memory.base
      });
    } else if (requisition && requisition.type === 'defender') {
      Spawner.spawnDefender(spawn, {
        mission: requisition.mission.id,
        key: requisition.key,
        defendTarget: requisition.memory.defendTarget,
      });
    }
  },

  run: function(room) {
    if (!room.controller || !room.controller.my) {
      return;
    }

    const spawn = room.find(FIND_MY_SPAWNS).filter(spawn => !spawn.spawning)[0];
    if (spawn) {
      ExpansionPlanner.spawnCreep(room, spawn);
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

Profiler.registerObject(ExpansionPlanner, 'ExpansionPlanner');

module.exports = ExpansionPlanner;
