const Rooms = require('Rooms');
const DefenseMission = require('DefenseMission');

class Overseer {
  static run() {
    for (const name in Game.rooms) {
      const room = Game.rooms[name];

      // If it's my room
      if (room.controller &&
          room.controller.my &&
          !Rooms.getDefenseMission(room)) {
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length) {
          DefenseMission.create(room.name);
        }
      }
    }
  }
}

module.exports = Overseer;
