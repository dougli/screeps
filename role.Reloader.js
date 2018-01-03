const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Task = require('Task');
const Rooms = require('Rooms');

class Reloader extends BaseUnit {
  static getIdealBuild(room) {
    const level = room.controller.level;
    const repeats = 3;
    if (level === 7) {
      repeats = 4;
    } else if (level === 8) {
      repeats = 6;
    }

    return BuildCosts.getBestRepeatingBuild(
      [MOVE, CARRY, CARRY],
      repeats,
      room.energyCapacityAvailable
    );
  }

  constructor(creep) {
    super(creep);
    if (!creep.room.reloaders) {
      creep.room.reloaders = {};
    }
    creep.room.reloaders[this.getQuadrant()] = this;
  }

  getQuadrant() {
    return this.creep.memory.quadrant;
  }

  isIdealBuild() {
    const room = this.creep.room;
    const ideal = Reloader.getIdealBuild(room.energyCapacityAvailable, room);
    return this.creep.body.length === ideal.length;
  }

  _tick() {
    const creep = this.creep;
    if (!this.hasTask()) {
      if (creep.carry.energy === 0) {
        this.setTask(
          new Task(Task.PICKUP, creep.room.storage, creep.carryCapacity)
        );
      } else {
        this.setTask(Rooms.getReloadTasks(this, creep.room)[0]);
      }
    }

    const result = this._doTask();
    if (result == OK) {
      return;
    } else if (result == 'NEED_ENERGY') {
      this.setTask(
        new Task(Task.PICKUP, creep.room.storage, creep.carryCapacity)
      );
      creep.moveToWithTrail(creep.room.storage);
    } else if (result == 'DONE') {
      // Do nothing - wait another turn
    }
  }
}

module.exports = Reloader;
