const BuildCosts = require('BuildCosts');
const BaseUnit = require('BaseUnit');

class Upgrader extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, MOVE, WORK, WORK, WORK, WORK,
       MOVE, WORK, WORK, WORK, WORK, MOVE, WORK, WORK, WORK, WORK],
      capacity);
  }

  constructor(creep) {
    super(creep);
    creep.room.upgrader = this;
  }

  getUpgradeTarget() {
    return Game.getObjectById(this.creep.memory.upgradeTarget);
  }

  _tick() {
    const result = this.creep.upgradeController(this.getUpgradeTarget());
    switch (result) {
    case ERR_NOT_IN_RANGE:
    case ERR_NOT_ENOUGH_RESOURCES:
      this.creep.moveToWithTrail(this.getUpgradeTarget());
    }
  }
}

module.exports = Upgrader;
