const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Rooms = require('Rooms');

class Builder extends BaseUnit {
  static getIdealBuild(energy) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, MOVE, WORK],
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
      if (!this.hasTask()) {
        // Find another build task -- we don't take the first task as it's the
        // one that was completed
        this.setTask(Rooms.getBuildTasks(this.getRoom())[1]);
        if (this.hasTask()) {
          this.creep.moveToWithTrail(this.getCurrentTask().target);
        }
      }
    }
  }
}

module.exports = Builder;
