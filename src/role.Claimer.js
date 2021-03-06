const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Profiler = require('Profiler');

const REUSE_PATH = 20;
const ME = 'dougli';

class Claimer extends BaseUnit {
  static getIdealBuild(energy) {
    return BuildCosts.getBestRepeatingBuild(
      [MOVE, CLAIM],
      4,
      energy
    );
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
    if (!targetRoom) {
      this.creep.moveToRoom(this.getReserveTarget());
      return;
    }

    // Otherwise start reserving
    const result = this.creep.reserveController(targetRoom.controller);
    if (result === ERR_NOT_IN_RANGE) {
      this.creep.moveToExperimental(targetRoom.controller);
      return;
    }

    if (!targetRoom.controller.sign ||
        targetRoom.controller.sign.username !== ME) {
      this.creep.signController(
        targetRoom.controller,
        'Proud member of the 10 CPU club!');
    }
  }
}

Profiler.registerClass(Claimer, 'Claimer');

exports.Claimer = Claimer;
