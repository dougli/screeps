var ExpansionPlanner = require('ExpansionPlanner');
var Miner = require('role.Miner');
var Mule = require('role.Mule');

var NUM_EXTENSIONS = [0, 0, 5, 10, 20, 30, 30, 30, 30];

const MULE_MAX_CARRY = 20;

var BUILD_COSTS = {};
BUILD_COSTS[WORK] = 100;
BUILD_COSTS[MOVE] = 50;
BUILD_COSTS[CARRY] = 50;

var Spawner = {
  constructBuildings: function(spawn) {
    var spawnPos = spawn.pos;

    var room = spawn.room;
    var level = room.controller.level;

    if (level > 1) {
      var supportedExtensions = NUM_EXTENSIONS[level];
      var extensions = room.find(FIND_MY_STRUCTURES, {
        filter: {structureType: STRUCTURE_EXTENSION}
      });
      var sites = room.find(FIND_MY_CONSTRUCTION_SITES, {
        filter: {structureType: STRUCTURE_EXTENSION}
      });
      var numExtensions = extensions.length + sites.length;
      for (var ii = numExtensions; ii < supportedExtensions; ii++) {
        Spawner.constructExtension(spawn);
      }
    }
  },

  constructExtension: function(spawn) {
    var sPos = spawn.pos;
    var xOff = 2;
    var yOff = 2;
    while (true) {
      for (var x = sPos.x - xOff; x <= sPos.x + xOff; x += 2) {
        for (var y = sPos.y - yOff; y <= sPos.y + yOff; y += 2) {
          if (x < 5 || x >= 45 || y < 5 || y >= 45) {
            continue;
          }

          var pos = new RoomPosition(x, y, sPos.roomName);
          if (Spawner.noneNearby(pos)) {
            pos.createConstructionSite(STRUCTURE_EXTENSION);
            return;
          }
        }
      }
      xOff++;
      yOff++;
    }
  },

  noneNearby: function(pos) {
    for (var ii = -1; ii <= 1; ii++) {
      for (var jj = -1; jj <= 1; jj++) {
        var x = pos.x + ii;
        var y = pos.y + jj;
        if (x < 0 || x >= 50 || y < 0 || y >= 50) {
          continue;
        }
        var nearby = new RoomPosition(x, y, pos.roomName);
        var terrain = nearby.lookFor(LOOK_TERRAIN)[0];
        if (terrain == 'wall') {
          return false;
        }

        var structure = nearby.lookFor(LOOK_STRUCTURES)[0];
        var site = nearby.lookFor(LOOK_CONSTRUCTION_SITES)[0];
        var type = (structure && structure.structureType) ||
            (site && site.structureType);
        if (type && type !== STRUCTURE_ROAD) {
          if (type !== STRUCTURE_EXTENSION ||
              (Math.abs(ii) + Math.abs(jj)) !== 2) {
            return false;
          }
        }
      }
    }

    return true;
  },

  spawnMiner: function(spawn, harvestTarget) {
    return spawn.createCreep(
      Miner.getIdealBuild(spawn.room.energyCapacityAvailable),
      undefined,
      {role: 'miner', harvestTarget});
  },

  spawnScout: function(spawn) {
    return spawn.createCreep([MOVE], undefined, {role: 'scout'});
  },

  spawnMule: function(spawn, assignedRoom) {
    return spawn.createCreep(
      Mule.getIdealBuild(spawn.room.energyCapacityAvailable),
      undefined,
      {role: 'mule', assignedRoom});
  },

  spawnIdealWorker: function(spawn, parts, memory) {
    var energyCapacity = spawn.room.energyCapacityAvailable;
    var energyNeeded = 0;
    var size = 0;
    for (; size < parts.length; size++) {
      var newEnergy = BUILD_COSTS[parts[size]] + energyNeeded;
      if (newEnergy > energyCapacity) {
        break;
      }
      energyNeeded = newEnergy;
    }

    return spawn.createCreep(parts.slice(0, size), undefined, memory);
  },

  run: function(spawn) {
    Spawner.constructBuildings(spawn);

    var creeps = spawn.room.find(FIND_MY_CREEPS);

    var counts = {};
    for (var name in creeps) {
      var creep = creeps[name];
      var role = creep.getType();
      counts[role] = (counts[role] || 0) + 1;
    }

    var plan = ExpansionPlanner.getRoomDevelopmentPlan(spawn.room);
    if (plan.action == 'spawn_miner') {
      Spawner.spawnMiner(spawn, plan.harvestTarget);
    } else if (plan.action == 'spawn_scout') {
      spawn.createCreep([MOVE], undefined, {role: 'scout'});
    } else if (plan.action == 'spawn_claimer') {
      spawn.createCreep(
        [MOVE, CLAIM, CLAIM],
        undefined,
        {role: 'claimer', claimTarget: plan.claimTarget}
      );
    } else if (plan.action == 'spawn_mule') {
      Spawner.spawnMule(spawn, plan.assignedRoom);
      // TODO: REGISTER MULE IN ROOM'S MEMORY!
    }
  }
};

module.exports = Spawner;
