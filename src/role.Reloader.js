const BaseLayout = require('BaseLayout');
const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Profiler = require('Profiler');
const Rooms = require('Rooms');
const Task = require('Task');

class Reloader extends BaseUnit {
  static getIdealBuild(room) {
    const level = room.controller.level;
    let repeats = 4;
    if (level >= 5 && level <= 7) {
      repeats = 8;
    } else if (level === 8) {
      repeats = 11;
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

  run() {
    const creep = this.creep;
    const storage = creep.room.storage;
    if (!storage) {
      return;
    }

    // If we're dying, dump everything back in storage
    if (creep.ticksToLive === 1 &&
        creep.transfer(storage, RESOURCE_ENERGY, creep.carry.enery) === OK) {
      return;
    }

    if (!this.hasTask()) {
      if (creep.carry.energy === 0) {
        this.setTask(
          new Task(Task.PICKUP, storage, creep.carryCapacity)
        );
      } else {
        const reloadTask = Rooms.getReloadTasks(this, creep.room)[0];
        if (reloadTask) {
          this.setTask(reloadTask);
        } else {
          creep.moveToExperimental(
            BaseLayout.getBenchPosition(creep.room, this.getQuadrant())
          );
          return;
        }
      }
    }

    const prevTask = this.getCurrentTask();
    const result = this._doTask();
    if (result == OK) {
      return;
    } else if (result == 'NEED_ENERGY') {
      this.setTask(new Task(Task.PICKUP, storage, creep.carryCapacity));
      creep.moveToExperimental(storage);
    } else if (result == 'DONE') {
      const reloadTasks = Rooms.getReloadTasks(this, creep.room);
      if (prevTask.type !== Task.TRANSFER) {
        this.setTask(reloadTasks[0]);
      } else {
        for (const reloadTask of reloadTasks) {
          if (reloadTask.target.id !== prevTask.target.id) {
            this.setTask(reloadTask);
            break;
          }
        }
      }
      if (this.getCurrentTask()) {
        creep.moveToExperimental(this.getCurrentTask().target);
      }
      // Do nothing - wait another turn
    }
  }
}

Profiler.registerClass(Reloader, 'Reloader');

exports.Reloader = Reloader;
