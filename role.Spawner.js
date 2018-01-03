const Builder = require('role.Builder');
const ExpansionPlanner = require('ExpansionPlanner');
const Miner = require('role.Miner');
const Mule = require('role.Mule');
const Upgrader = require('role.Upgrader');
const Reloader = require('role.Reloader');

var NUM_EXTENSIONS = [0, 0, 5, 10, 20, 30, 30, 30, 30];

const MULE_MAX_CARRY = 20;

var BUILD_COSTS = {};
BUILD_COSTS[WORK] = 100;
BUILD_COSTS[MOVE] = 50;
BUILD_COSTS[CARRY] = 50;

var Spawner = {
  spawnMiner: function(spawn, harvestTarget, minimum = false) {
    const parts = minimum
          ? [MOVE, CARRY, WORK]
          : Miner.getIdealBuild(spawn.room.energyCapacityAvailable);

    return spawn.createCreep(
      parts,
      undefined,
      {role: 'miner', harvestTarget});
  },

  spawnMule: function(spawn, haulTarget, minimum = false) {
    const parts = minimum
          ? [MOVE, CARRY]
          : Mule.getIdealBuild(spawn.room.energyCapacityAvailable);
    return spawn.spawnCreep(
      parts,
      undefined,
      {memory: {role: 'mule', haulTarget}});
  },

  spawnRecoveryMule: function(spawn, haulTarget) {
    const result = Spawner.spawnMule(spawn, haulTarget, false);
    if (result === OK) {
      return OK;
    }

    return spawn.spawnCreep(
      [MOVE, CARRY, MOVE, CARRY, MOVE, CARRY],
      undefined,
      {memory: {role: 'mule', haulTarget}});
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

  spawnScout: function(spawn) {
    return spawn.createCreep([MOVE], undefined, {role: 'scout'});
  },

  run: function(spawn) {
    var plan = ExpansionPlanner.getRoomDevelopmentPlan(spawn.room);
    if (plan.action == 'spawn_miner') {
      Spawner.spawnMiner(spawn, plan.harvestTarget);
    } else if (plan.action == 'spawn_minimum_miner') {
      Spawner.spawnMiner(spawn, plan.harvestTarget, true);
    // } else if (plan.action == 'spawn_scout') {
    //   spawn.createCreep([MOVE], undefined, {role: 'scout'});
    // } else if (plan.action == 'spawn_claimer') {
    //   spawn.createCreep(
    //     [MOVE, CLAIM, CLAIM],
    //     undefined,
    //     {role: 'claimer', claimTarget: plan.claimTarget}
    //   );
    } else if (plan.action == 'spawn_mule') {
      Spawner.spawnMule(spawn, plan.haulTarget);
    } else if (plan.action == 'spawn_minimum_mule') {
      Spawner.spawnMule(spawn, plan.haulTarget, true);
    } else if (plan.action == 'spawn_recovery_mule') {
      Spawner.spawnRecoveryMule(spawn, plan.haulTarget);
    } else if (plan.action == 'spawn_reloader') {
      Spawner.spawnReloader(spawn, plan.quadrant);
    } else if (plan.action == 'spawn_upgrader') {
      Spawner.spawnUpgrader(spawn, plan.upgradeTarget);
    } else if (plan.action == 'spawn_builder') {
      Spawner.spawnBuilder(spawn, plan.room);
    }
  }
};

module.exports = Spawner;
