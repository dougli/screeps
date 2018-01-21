const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Rooms = require('Rooms');
const Task = require('Task');

class Repairer extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestRepeatingBuild(
      [WORK, CARRY, MOVE, MOVE],
      5,
      capacity
    );
  }

  constructor(creep) {
    super(creep);
    this.creep.room.repairer = this;
  }

  _tick() {
    const room = this.creep.room;
    if (!this.hasTask()) {
      this._setNextTask();
    }

    const result = this._doTask();
    if (result === OK) {
      return;
    } else if (result === 'NEED_ENERGY') {
      if (room.storage) {
        this.setTask(new Task(Task.PICKUP, room.storage, 10000));
      }
    } else if (result === 'DONE') {
      if (!this.hasTask()) {
        this._setNextTask();
      }
    }
  }

  _setNextTask() {
    let task = Rooms.getBuildDefenseTasks(this.creep.room, this.creep.pos)[0];
    if (task) {
      this.setTask(task);
      return;
    }

    task = Rooms.getRepairerTasks(this.creep.room, this.creep.pos)[0];
    task && this.setTask(task);
  }

}

module.exports = Repairer;
