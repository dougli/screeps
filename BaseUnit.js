const Sources = require('Sources');
const Task = require('Task');

const DONE = 'DONE';
const NEED_ENERGY = 'NEED_ENERGY';
const PATH_REUSE = 10;

class BaseUnit {
  constructor(creep) {
    this.creep = creep;
    this.creep.unit = this;
    if (this.getMission()) {
      this.getMission().provideCreep(this.getMissionKey(), this);
    }
  }

  hasTask() {
    return !!this.getCurrentTask();
  }

  getCurrentTask() {
    return this.creep.tasks[0];
  }

  setTask(task) {
    if (task) {
      this.creep.tasks = [task];
    }
  }

  getMission() {
    return Game.missions[this.creep.memory.mission];
  }

  getMissionKey() {
    return this.creep.memory.missionKey;
  }

  isDyingSoon() {
    return this.creep.ticksToLive <= this.creep.body.length * 3;
  }

  _doTask() {
    const ACTION_MAP = {
      [Task.PICKUP]: this._pickup,
      [Task.TRANSFER]: this._transfer,
      [Task.SCOUT]: this._scout,
      // [Task.REPAIR]: this._repair,
      [Task.BUILD]: this._build,
      // [Task.UPGRADE]: this._upgrade,
    };

    const task = this.getCurrentTask();
    if (task) {
      const result = ACTION_MAP[task.type].apply(this, [task]);
      if (result === 'DONE') {
        this.creep.tasks.shift();
      }
      return result;
    }

    return DONE;
  }

  run() {
    const creep = this.creep;

    // Pickup nearby jonx
    const nearbyEnergy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
    if (nearbyEnergy.length > 0) {
      if (creep.memory.role === 'builder' || creep.memory.role === 'upgrader') {
        creep.pickup(nearbyEnergy[0]);
      } else {
        const nearbyCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 2);
        const nearBuilder = nearbyCreeps.some(
          creep => (creep.memory.role === 'builder' || creep.memory.role === 'upgrader')
        );
        if (!nearBuilder) {
          creep.pickup(nearbyEnergy[0]);
        }
      }
    }

    this._tick();
  }

  _pickup(task) {
    const creep = this.creep;
    let needed = creep.carryCapacity - creep.carry.energy;
    if (needed === 0) {
      return DONE;
    }

    // Prioritize containers, then miners
    if (task.target instanceof Source) {
      const container = Sources.getContainerFor(task.target);
      if (container) {
        task.target = container;
      } else if (Sources.getMinersFor(task.target).length) {
        task.target = Sources.getMinersFor(task.target)[0].creep;
      }
    }

    if (task.target instanceof StructureContainer ||
        task.target instanceof StructureStorage) {
      if (!creep.pos.isNearTo(task.target)) {
        creep.moveToExperimental(task.target);
        return OK;
      }

      // Wait until we have enough to withdraw to save CPU
      const available = task.target.store[RESOURCE_ENERGY];
      if (available < needed) {
        return OK;
      }

      switch (creep.withdraw(task.target, RESOURCE_ENERGY, needed)) {
      case OK:
      default:
        return DONE;
      }
    } else if (task.target instanceof Creep) {
      creep.moveToExperimental(task.target);
      return OK;
    } else {
      creep.moveToExperimental(task.target);
      return OK;
    }
  }

  _transfer(task) {
    const creep = this.creep;
    const target = task.target;

    if (target instanceof Creep) {
      if (creep.pos.isNearTo(target)) {
        creep.drop(RESOURCE_ENERGY);
        return DONE;
      } else {
        creep.moveToExperimental(target);
        return OK;
      }
    }

    const currentEnergy = creep.carry.energy;
    const needed = target.energyCapacity - target.energy;
    const amount = Math.min(needed, task.amount, currentEnergy);

    if (amount <= 0) {
      return currentEnergy === 0 ? NEED_ENERGY : DONE;
    }

    switch (creep.transfer(target, RESOURCE_ENERGY, amount)) {
    case ERR_NOT_ENOUGH_RESOURCES:
      return NEED_ENERGY;
    case OK:
      if (amount >= currentEnergy) {
        return NEED_ENERGY;
      } else {
        return DONE;
      }
    case ERR_NOT_IN_RANGE:
      creep.moveToExperimental(target);
      return OK;
    case ERR_INVALID_TARGET:
    case ERR_FULL:
    default:
      return DONE;
    }
  }

  _scout(task) {
    const creep = this.creep;
    const targetRoom = task.target;
    const pos = this.creep.pos;
    if (pos.roomName === targetRoom &&
        pos.x > 0 && pos.x < 49 && pos.y > 0 && pos.y < 49) {
      return DONE;
    }

    const result = this.creep.moveToRoom(targetRoom);

    if (result === ERR_NO_PATH) {
      return DONE;
    }
    return OK;
  }

  // _repair(task) {
  //   const creep = this.creep;
  //   const energy = creep.carry.energy;

  //   if (task.target.hits === task.target.hitsMax) {
  //     return FAILED;
  //   }

  //   switch (creep.repair(task.target)) {
  //   case OK:
  //     return energy <= creep.getActiveBodyparts(WORK)
  //       ? NEED_ENERGY
  //       : true;
  //   case ERR_NOT_IN_RANGE:
  //     creep.moveToExperimental(task.target);
  //     return true;
  //   case ERR_INVALID_TARGET:
  //   default:
  //     creep.say('failed');
  //     return FAILED;
  //   }
  // }

  _build(task) {
    const creep = this.creep;
    const energy = creep.carry.energy;

    switch (creep.build(task.target)) {
    case OK:
      return energy <= creep.getActiveBodyparts(WORK) * 5
        ? NEED_ENERGY
        : OK;
    case ERR_NOT_IN_RANGE:
      creep.moveToExperimental(task.target);
      return OK;
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.moveToExperimental(task.target);
      return NEED_ENERGY;
    case ERR_INVALID_TARGET:
    default:
      return DONE;
    }
  }
}

module.exports = BaseUnit;
