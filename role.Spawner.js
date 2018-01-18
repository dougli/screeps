const Builder = require('role.Builder');
const ExpansionPlanner = require('ExpansionPlanner');
const Miner = require('role.Miner');
const Mule = require('role.Mule');
const Upgrader = require('role.Upgrader');
const Reloader = require('role.Reloader');
const Profiler = require('Profiler');

var NUM_EXTENSIONS = [0, 0, 5, 10, 20, 30, 30, 30, 30];

const MULE_MAX_CARRY = 20;

var BUILD_COSTS = {};
BUILD_COSTS[WORK] = 100;
BUILD_COSTS[MOVE] = 50;
BUILD_COSTS[CARRY] = 50;

var Spawner = {
  spawnMinimumMiner: function(spawn, harvestTarget) {
    if (spawn.room.energyAvailable < 400 ||
        Spawner.spawnMiner(spawn, {harvestTarget}) !== OK) {
      return spawn.spawnCreep(
        [MOVE, CARRY, WORK],
        Math.random().toString(16).substring(2),
        {memory: {role: 'miner', harvestTarget}});
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
    const parts = minimum
          ? [MOVE, CARRY]
          : Mule.getIdealBuild(spawn.room.energyCapacityAvailable);
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

  run: function(spawn) {
    var plan = ExpansionPlanner.getRoomDevelopmentPlan(spawn.room);
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
    } else if (plan.action == 'spawn_scout') {
      Spawner.spawnScout(spawn, plan.mission, plan.key);
    } else if (plan.action == 'spawn_claimer') {
      Spawner.spawnClaimer(spawn, plan.mission, plan.key);
    }
  }
};

Profiler.registerObject(Spawner, 'Spawner');

module.exports = Spawner;
