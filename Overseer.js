const Rooms = require('Rooms');
const DefenseMission = require('DefenseMission');

var EXPLORE_PING = 1000;
var HOSTILE_EXPLORE_PING = 6000;

class Overseer {
  static run() {
    for (const name in Game.rooms) {
      const room = Game.rooms[name];

      // If it's my room, see if I have to defend it
      if (room.controller &&
          room.controller.my &&
          !Rooms.getDefenseMission(room)) {
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length) {
          DefenseMission.create(room.name);
        }
      }

      // Scout nearby rooms on a schedule

    }
  }

  static getScoutCandidates(roomName) {
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
  }
}

module.exports = Overseer;
