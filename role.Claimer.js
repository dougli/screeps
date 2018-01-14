const BaseUnit = require('BaseUnit');

const REUSE_PATH = 20;

class Claimer extends BaseUnit {
  static getIdealBuild(energy) {
    return [MOVE, MOVE, CLAIM, CLAIM];
  }

  constructor(creep) {
    super(creep);
    if (this.getMission()) {
      this.getMission().provideCreep(this.getMissionKey(), this);
    }
  }

  getMission() {
    return Game.missions[this.creep.memory.mission];
  }

  getMissionKey() {
    return this.creep.memory.missionKey;
  }

  getReserveTarget() {
    return this.creep.memory.room;
  }

  setReserveTarget(name) {
    this.creep.memory.room = name;
  }

  run() {
    const targetRoom = Game.rooms[this.getReserveTarget()];

    // If we're not in the right room yet, get there
    if (this.creep.room.name != this.getReserveTarget()) {
      const dest = targetRoom
        ? targetRoom.controller
        : new RoomPosition(25, 25, this.getReserveTarget());
      this.creep.moveTo(dest, {reusePath: REUSE_PATH});
      return;
    }

    // Otherwise start reserving
    const result = this.creep.reserveController(targetRoom.controller);
    if (result === ERR_NOT_IN_RANGE) {
      this.creep.moveTo(targetRoom.controller);
    }

    if (!targetRoom.controller.sign ||
        targetRoom.controller.sign.username !== ME) {
      this.creep.signController(
        targetRoom.controller,
        'My mine miners mining mines mine my mines.');
    }
  }
}

module.exports = Claimer;
