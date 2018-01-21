const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Rooms = require('Rooms');
const Task = require('Task');

class Repairer extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestRepeatingBuild(
      [WORK, CARRY, MOVE, MOVE],
      4,
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
      this.setTask(Rooms.getRepairTasks(room, this.creep.pos)[0]);
      return;
    }

    const result = this._doTask();
    if (result === OK) {
      return;
    } else if (result === 'NEED_ENERGY') {
      if (room.storage) {
        this.setTask(new Task(Task.PICKUP, room.storage, 10000));
      }
      return;
    } else if (result === 'DONE') {
      if (!this.hasTask()) {
        // Find another repair task -- we don't take the first task as it's the
        // one that was completed
        this.setTask(Rooms.getRepairTasks(room, this.creep.pos)[1]);
        if (this.hasTask()) {
          this.creep.moveToExperimental(this.getCurrentTask().target);
        }
      }
    }
  }
}

module.exports = Repairer;
