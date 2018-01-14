const BaseUnit = require('BaseUnit');
const Task = require('Task');

const PATH_REUSE = 20;

class Scout extends BaseUnit {
  static getIdealBuild(energy) {
    return [MOVE];
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

  getRoomName() {
    return this.creep.room.name;
  }

  setTarget(target) {
    this.setTask(new Task(Task.SCOUT, target));
  }

  run() {
    if (this.creep.ticksToLive == CREEP_LIFE_TIME) {
      this.creep.notifyWhenAttacked(false);
    }
    this._doTask();
  }
}

module.exports = Scout;
