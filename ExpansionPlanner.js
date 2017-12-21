var OPPOSITE_DIR = {};
OPPOSITE_DIR[LEFT] = RIGHT;
OPPOSITE_DIR[RIGHT] = LEFT;
OPPOSITE_DIR[TOP] = BOTTOM;
OPPOSITE_DIR[BOTTOM] = TOP;

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

  transferMinedToCreep: function(miner, target, amount) {
    return miner.transfer(target, RESOURCE_ENERGY, amount);
  },

  refillCreep: function(creep, container, amount) {
    return creep.withdraw(container, RESOURCE_ENERGY, amount);
  },

  getRoomDevelopmentPlan: function(room) {
    var miners = {};
    var claimers = {};
    var demand = 0;

    let hasMule = false;

    const sources = {};
    room.find(FIND_SOURCES).sort((a, b) => {
      return a.id < b.id ? -1 : 1;
    }).forEach((source) => {
      sources[source.id] = {};
    });

    for (var creepName in Game.creeps) {
      let creep = Game.creeps[creepName];
      if (creep.ticksToLive < creep.body.length * 3) {
        continue;
      }

      if (creep.memory.role == 'miner') {
        const target = creep.memory.harvestTarget;
        sources[target].miner = creep;
      } else if (creep.memory.role == 'mule') {
        hasMule = true;
        const target = creep.memory.haulTarget;
        sources[target].mule = creep;
      } else if (creep.memory.role == 'claimer') {
        claimers[creep.memory.claimTarget] = true;
      }
    };

    // First, check we've developed all sources in the same room
    // Every source should have 1 miner and 1 hauler
    for (let id in sources) {
      if (!sources[id].miner) {
        return {action: 'spawn_miner', harvestTarget: id};
      } else if (!sources[id].mule) {
        if (!hasMule) {
          return {action: 'spawn_minimum_mule', haulTarget: id};
        }
        return {action: 'spawn_mule', haulTarget: id};
      }
    }

    // Check other rooms for sources too
    // if (room.controller &&
    //     room.controller.my &&
    //     room.controller.level >= 3 &&
    //     room.energyCapacityAvailable >= 800) {
    //   const exits = Game.map.describeExits(room.name);
    //   for (let dir in exits) {
    //     if (!ExpansionPlanner.wasRoomHostile(exits[dir])) {
    //       roomsToCheck.push(exits[dir]);
    //     }
    //   }
    // }


    if (room.controller.level >= 4) {
      var candidates = ExpansionPlanner.getScoutCandidates(room.name);
      if (Object.keys(candidates).length) {
        var hasScout = false;
        for (var creepName in creeps) {
          hasScout = creeps[creepName].memory.role === 'scout';
          if (hasScout) {
            break;
          }
        }
        if (!hasScout) {
          return {action: 'spawn_scout'};
        }
      }
    }

    // Check if we need to claim other rooms
    if (room.energyCapacityAvailable >= 1250) {
      for (let sourceID in miners) {
        let source = Game.getObjectById(sourceID);
        if (source &&
            source.room.controller &&
            !source.room.controller.owner &&
            !(source.room.controller.id in claimers)) {
          let reservation = source.room.controller.reservation;
          if (!reservation ||
              (reservation.username === 'dougli' && reservation.ticksToEnd < MIN_RESERVATION)) {
            return {action: 'spawn_claimer', claimTarget: source.room.controller.id};
          }
        }
      }
    }

    return {};
  },

  getRoomMemory: function(room) {
    var now = Game.time;
    if (room.memory && room.memory.lastSeen > 0) {
      return room.memory;
    }

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

  run: function() {
    var now = Game.time;
    for (var name in Game.rooms) {
      var room = Game.rooms[name];
      var memory = ExpansionPlanner.getRoomMemory(room);


      if (!room.controller || !room.controller.my) {
        Object.assign(memory, ExpansionPlanner._getLiveStats(room));
      }

      memory.lastSeen = now;
    }
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
module.exports = ExpansionPlanner;
