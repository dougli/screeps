const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const TaskList = require('TaskList');

class Builder extends BaseUnit {
  static getIdealBuild(energy) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, MOVE, WORK, WORK],
      energy
    );
  }

  constructor(creep) {
    this.creep = creep;
  }

  _tick() {
    if (!this.hasTask()) {
      this.setTask(TaskList.getBuildTask(this.creep));
      return;
    }

    const result = this._doTask();
    if (result === OK) {
      return;
    } else if (result === 'NEED_ENERGY') {
      // Either we get some energy, or we wait for a mule
      // If there is a mule + a miner, we wait, otherwise we go fetch juice

      // 1. Find mule within reasonable distance
      // 2. Find miner within reasonable distance

      // 3. Else, mine
      var pickup = TaskList.getPickupTask(this.creep, 0);
      if (pickup.length > 0) {
        this.creep.tasks.unshift(pickup[0])
      }
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
