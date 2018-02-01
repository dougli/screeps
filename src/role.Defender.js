const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');

class Defender extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestRepeatingBuild(
      [TOUGH, TOUGH, ATTACK, RANGED_ATTACK, MOVE, MOVE],
      8,
      capacity
    );
  }

  constructor(creep) {
    super(creep);
  }

  _tick() {
    const creep = this.creep;
    const hostiles = creep.room.find(FIND_HOSTILE_CREEPS);

    if (!hostiles.length) {
      this.creep.moveToRoom(creep.memory.defendTarget);
      return;
    }

    creep.attack(hostiles[0]);
    creep.rangedAttack(hostiles[0]);
    creep.moveToExperimental(hostiles[0]);
  }
}

exports.Defender = Defender;
