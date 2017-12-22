const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Worker = require('role.Worker');
const Task = require('Task');
const Rooms = require('Rooms');

class Mule extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestRepeatingBuild([MOVE, CARRY, CARRY], 6, capacity);
  }

  constructor(creep) {
    super(creep);
    const source = this.getHaulSource();
    if (source) {
      source.mule = this;
    }
  }

  getHaulSource() {
    return Game.getObjectById(this.creep.memory.haulTarget);
  }

  _tick() {
    const creep = this.creep;

    if (!this.hasTask()) {
      if (creep.carry.energy === 0) {
        this.setTask(
          new Task(Task.PICKUP, this.getHaulSource(), creep.carryCapacity)
        );
      } else {
        // Find a dropoff task
        this.setTask(Rooms.getDropoffTasks(creep.room)[0]);
      }
    }

    const result = this._doTask();
    if (result == OK) {
      return;
    } else if (result == 'NEED_ENERGY') {
      this.setTask(
        new Task(Task.PICKUP, this.getHaulSource(), creep.carryCapacity)
      );
    } else if (result == 'DONE') {
      // Find a dropoff task
      this.setTask(Rooms.getDropoffTasks(creep.room)[0]);
    }
  }
}

module.exports = Mule;
