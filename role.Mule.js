const BaseUnit = require('BaseUnit');
const BuildCosts = require('BuildCosts');
const Task = require('Task');
const Rooms = require('Rooms');
const Profiler = require('Profiler');
const Paths = require('Paths');
const BaseLayout = require('BaseLayout');
const Sources = require('Sources');

class Mule extends BaseUnit {
  static getIdealBuild(baseRoom, sourcePos, energyPerTick) {
    const room = Game.rooms[baseRoom];
    if (!room) {
      return [];
    }

    const roundTripTicks = Mule.getHaulDistance(baseRoom, sourcePos);
    const energyTotal = energyPerTick * roundTripTicks;
    const carryNeeded = Math.ceil(energyTotal / CARRY_CAPACITY) + 1;
    const capacity = room.energyCapacityAvailable;

    return BuildCosts.getBestRepeatingBuild(
      [MOVE, CARRY],
      carryNeeded,
      capacity
    );
  }

  static getHaulDistance(baseRoom, sourcePos) {
    const room = Game.rooms[baseRoom];
    if (!room) {
      return null;
    }

    const origin = BaseLayout.getBaseCenter(room);
    const capacity = room.energyCapacityAvailable;
    return Math.max(1, Paths.search(
      origin,
      sourcePos,
      {ignoreCreeps: true, ignoreRoads: true}
    ).cost * 2);
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

  getHaulDistance() {
    const mem = this.creep.memory;
    if (!mem.haulDistance) {
      const sourcePos = Sources.getSourcePosition(mem.haulRoom, mem.haulTarget);
      mem.haulDistance = Mule.getHaulDistance(this.creep.memory.base, sourcePos);
    }
    return mem.haulDistance;
  }

  getMuleSpeed() {
    return this.creep.getActiveBodyparts(CARRY) * CARRY_CAPACITY /
      this.getHaulDistance();
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
