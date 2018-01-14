const DefenseMission = require('DefenseMission');
const ScoutMission = require('ScoutMission');

class MissionLoader {
  static loadAll() {
    if (Game.missions) {
      return;
    }

    Game.missions = {};
    if (!Memory.missions) {
      return;
    }

    for (const id in Memory.missions) {
      const memory = Memory.missions[id];
      switch (memory.type) {
      case 'defense':
        DefenseMission.deserialize(id, memory);
        break;
      case 'scout':
        ScoutMission.deserialize(id, memory);
        break;
      default:
        console.log('Cannot deserialize mission ' + id);
        break;
      }
    }
  }
}

module.exports = MissionLoader;
