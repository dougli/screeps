const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Task = require('Task');
const Rooms = require('Rooms');
const Profiler = require('Profiler');

class Mule extends BaseUnit {
  static getIdealBuild(capacity) {
    // Roadless config
    return BuildCosts.getBestRepeatingBuild([MOVE, CARRY], 12, capacity);
  }

  constructor(creep) {
    super(creep);
    const source = this.getHaulSource();
    if (source) {
      source.mules = source.mules || [];
      source.mules.push(this);
    }
  }

  getHaulSource() {
    return Game.getObjectById(this.creep.memory.haulTarget);
  }

  getMuleSpeed() {
    // Assuming an average round trip takes 60 ticks:
    // efficiency = carryCapacity / roundTripTime;
    return this.creep.getActiveBodyparts(CARRY) * 50 / 60;
  }

  _setPickupTask() {
    const source = this.getHaulSource();
    let task = null;
    if (source) {
      task = new Task(Task.PICKUP, this.getHaulSource(), this.creep.carryCapacity);
    } else {
      task = new Task(Task.SCOUT, this.creep.memory.haulRoom);
    }
    this.setTask(task);
  }

  _tick() {
    const creep = this.creep;

    if (!this.hasTask()) {
      if (creep.carry.energy === 0) {
        this._setPickupTask();
      } else {
        let base = Game.rooms[creep.memory.base] || creep.room;
        // Find a dropoff task
        this.setTask(Rooms.getDropoffTasks(base, creep.pos)[0]);
      }
    }

    const result = this._doTask();
    if (result == OK) {
      return;
    } else if (result == 'NEED_ENERGY') {
      this._setPickupTask();
      this._doTask();
    } else if (result == 'DONE') {
      // Do nothing - wait another turn
    }
  }
}

Profiler.registerClass(Mule, 'Mule');

module.exports = Mule;
