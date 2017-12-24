const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const TaskList = require('TaskList');
const Rooms = require('Rooms');

class Builder extends BaseUnit {
  static getIdealBuild(energy) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, MOVE, WORK, WORK],
      energy
    );
  }

  constructor(creep) {
    super(creep);
    if (this.getRoom()) {
      this.getRoom().builder = this;
    }
  }

  getRoom() {
    return Game.rooms[this.creep.memory.room];
  }

  _tick() {
    if (!this.hasTask()) {
      this.setTask(Rooms.getBuildTasks(this.getRoom())[0]);
      return;
    }

    const result = this._doTask();
    if (result === OK) {
      return;
    } else if (result === 'NEED_ENERGY') {
      // Just wait for a mule if we need energy
      return;
    } else if (result === 'DONE') {
      if (this.creep.tasks.length === 0) {
        // Find another build task
        this.creep.tasks.push(TaskList.getBuildTask(this.creep));
        if (this.creep.tasks[0]) {
          this.creep.moveToWithTrail(this.creep.tasks[0].target);
        }
      }
    }
  }
}

module.exports = Builder;
