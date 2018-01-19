const BaseUnit = require('BaseUnit');
const Task = require('Task');
const Profiler = require('Profiler');

const PATH_REUSE = 20;

class Scout extends BaseUnit {
  static getIdealBuild(energy) {
    return [MOVE];
  }

  getRoomName() {
    return this.creep.room.name;
  }

  setTarget(target) {
    this.setTask(new Task(Task.SCOUT, target));
  }

  run() {
    if (this.creep.ticksToLive >= CREEP_LIFE_TIME - 1) {
      this.creep.notifyWhenAttacked(false);
    }
    this._doTask();
  }
}

Profiler.registerClass(Scout, 'Scout');

module.exports = Scout;
