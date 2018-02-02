const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Task = require('Task').Task;
const Rooms = require('Rooms');
const Profiler = require('Profiler');
const Paths = require('Paths');
const BaseLayout = require('BaseLayout');
const Sources = require('Sources');

class Mule extends BaseUnit {
  static getIdealBuild(baseRoom, distance, energyPerTick) {
    const room = Game.rooms[baseRoom];
    if (!room) {
      return [];
    }

    const energyTotal = energyPerTick * distance * 2;
    const carryNeeded = Math.ceil(energyTotal / CARRY_CAPACITY) + 1;
    const capacity = room.energyCapacityAvailable;

    return BuildCosts.getBestRepeatingBuild(
      [MOVE, CARRY],
      carryNeeded,
      capacity
    );
  }

  constructor(creep) {
    super(creep);
    const source = this.getHaulSource();
    if (source) {
      source.mules = source.mules || [];
      source.mules.push(this);
    }
  }

  isDyingSoon() {
    const buildTime = this.creep.body.length * 3;
    let walkTime = this.getHaulDistance();
    return this.creep.ticksToLive <= buildTime + walkTime + 1;
  }

  getHaulSource() {
    return Game.getObjectById(this.creep.memory.haulTarget);
  }

  getHaulDistance() {
    const mem = this.creep.memory;
    return Sources.getDistanceToBase(mem.haulRoom, mem.haulTarget, mem.base);
  }

  getMuleSpeed() {
    return this.creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY /
      (this.getHaulDistance() * 2);
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

  _setDropoffTask(curr) {
    const base = Game.rooms[this.creep.memory.base] || this.creep.room;
    const tasks = Rooms.getDropoffTasks(base, this.creep.pos);
    for (const task of tasks) {
      if (!curr || task.target.id !== curr.target.id) {
        this.setTask(task);
        return;
      }
    }
  }

  _tick() {
    const replenishedBy = this.getReplenishedBy();
    if (this.moveToReplenishTarget()) {
      return;
    } else if (replenishedBy) {
      if (this.creep.transfer(replenishedBy.creep, RESOURCE_ENERGY) === OK) {
        this.creep.suicide();
        return;
      }
    }

    const creep = this.creep;

    if (!this.hasTask()) {
      if (creep.carry.energy === 0) {
        this._setPickupTask();
      } else {
        // Find a dropoff task
        this._setDropoffTask();
      }
    }

    const curr = this.getCurrentTask();
    const result = this._doTask();
    if (result == OK) {
      return;
    } else if (result == 'NEED_ENERGY') {
      this._setPickupTask();
      this._doTask();
    } else if (result == 'DONE') {
      this._setDropoffTask(curr);
      if (this.getCurrentTask()) {
        this.creep.moveToExperimental(this.getCurrentTask().target);
      }
    }
  }
}

Profiler.registerClass(Mule, 'Mule');

exports.Mule = Mule;
