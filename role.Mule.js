const BaseCreep = require('BaseCreep');
const BuildCosts = require('BuildCosts');
const Worker = require('role.Worker');
const Task = require('Task');
const TaskList = require('TaskList');

class Mule extends BaseCreep {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestRepeatingBuild([MOVE, CARRY, CARRY], 6, capacity);
  }

  constructor(creep) {
    this.creep = creep;
  }

  _tick() {
    if (!this.hasTask()) {
      return;
    }

    const creep = this.creep;

    // Pickup nearby jonx
    const nearbyEnergy = creep.pos.findInRange(FIND_DROPPED_ENERGY, 1);
    if (nearbyEnergy.length > 0) {
      creep.pickup(nearbyEnergy[0]);
    }

    if (!creep.tasks.length) {
      if (creep.carry.energy === 0) {
        creep.tasks = TaskList.getPickupTask(creep, 0, false);
      } else {
        creep.tasks = TaskList.getMuleTransferTasks(creep);
      }
    }

    while (creep.tasks.length > 0) {
      let task = creep.tasks[0];
      let fn = ACTION_MAP[task.type];
      let result = fn(creep);

      if (result === true) {
        return;
      } else if (result === FAILED) {
        creep.tasks.shift();
      } else if (result === MOVE_WITH_ENERGY) {
        creep.tasks.shift();
        if (!creep.tasks.length) {
          creep.tasks = TaskList.getMuleTransferTasks(creep);
        }
        if (creep.tasks[0]) {
          creep.moveToWithTrail(creep.tasks[0].target);
        }
        return;
      } else if (result === MOVE_WITHOUT_ENERGY) {
        creep.tasks.shift();
        if (!creep.tasks.length) {
          creep.tasks = TaskList.getPickupTask(creep, 0, false);
        }
        if (creep.tasks[0]) {
          creep.moveToWithTrail(creep.tasks[0].target);
        }
        return;
      } else {
        console.log('worker:' + task.type + ' returned bogus. ID: ' + creep.id);
        creep.tasks.shift();
        return;
      }
    }

    // This happens sometimes due to miners transferring to workers.
    // I didn't bother to sync that logic here, since it lives on the miner
    // and tries to detect nearby workers that are mining.
    console.log('worker ran out of tasks. ID: ' + creep.name);
  }
}

var ACTION_MAP = {
    [Task.PICKUP]: Worker.pickup,
    [Task.TRANSFER]: Worker.transfer,
};

module.exports = Mule;
