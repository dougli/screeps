var pickOne = require('pickOne');
var Task = require('Task');
var TaskList = require('TaskList');

var DIRECTIONS = [TOP_LEFT, TOP, TOP_RIGHT, RIGHT, BOTTOM_RIGHT, BOTTOM, BOTTOM_LEFT, LEFT];

var MOVE_WITH_ENERGY = 'move_with_energy';
var MOVE_WITHOUT_ENERGY = 'move_no_energy';
var FAILED = 'failed';

var Worker = {
  pickup: function(creep) {
    let needed = creep.carryCapacity - creep.carry.energy;
    if (needed === 0) {
      return FAILED;
    }

    let task = creep.tasks[0];

    // Prioritize containers, then miners, then mine
    if (task.target instanceof StructureContainer) {
      switch (creep.withdraw(task.target, RESOURCE_ENERGY, task.amount)) {
      case ERR_NOT_IN_RANGE:
        creep.moveToWithTrail(task.target);
        return true;
      case OK:
        return MOVE_WITH_ENERGY;
      case ERR_FULL:
      case ERR_NOT_ENOUGH_RESOURCES:
      default:
        return FAILED;
      }
    }
  },

  harvest: function(creep) {
    let needed = creep.carryCapacity - creep.carry.energy;
    if (needed === 0) {
      return FAILED;
    }

    var target = creep.tasks[0].target;
    switch (creep.harvest(target)) {
    case ERR_NOT_IN_RANGE:
      creep.moveToWithTrail(target);
      return true;
    case OK:
      if (needed <= creep.getActiveBodyparts(WORK) * 2) {
        return MOVE_WITHOUT_ENERGY;
      }
      return true;
    default:
      return FAILED;
    }
  },

  transfer: function(creep) {
    let task = creep.tasks[0];
    const currentEnergy = creep.carry.energy;
    const needed = task.target.energyCapacity - task.target.energy;
    const amount = Math.min(needed, task.amount);

    if (amount <= 0 || currentEnergy < amount) {
      return FAILED;
    }

    var target = task.target;
    if (target.energy == target.energyCapacity) {
      return FAILED;
    }

    switch (creep.transfer(target, RESOURCE_ENERGY, amount)) {
    case OK:
      return amount < currentEnergy
        ? MOVE_WITH_ENERGY
        : MOVE_WITHOUT_ENERGY;
    case ERR_NOT_IN_RANGE:
      creep.moveToWithTrail(target);
      return true;
    case ERR_INVALID_TARGET:
    case ERR_FULL:
    default:
      return FAILED;
    }
  },

  repair: function(creep) {
    const energy = creep.carry.energy;
    const task = creep.tasks[0];

    if (task.target.hits === task.target.hitsMax) {
      return FAILED;
    }

    switch (creep.repair(task.target)) {
    case OK:
      return energy <= creep.getActiveBodyparts(WORK)
        ? MOVE_WITHOUT_ENERGY
        : true;
    case ERR_NOT_IN_RANGE:
      creep.moveToWithTrail(task.target);
      return true;
    case ERR_INVALID_TARGET:
    default:
      creep.say('failed');
      return FAILED;
    }
  },

  build: function(creep) {
    const energy = creep.carry.energy;

    const task = creep.tasks[0];
    switch (creep.build(task.target)) {
    case OK:
      return energy <= creep.getActiveBodyparts(WORK) * 5
        ? MOVE_WITHOUT_ENERGY
        : true;
    case ERR_NOT_IN_RANGE:
      creep.moveToWithTrail(task.target);
      return true;
    case ERR_INVALID_TARGET:
    default:
      return FAILED;
    }
  },

  upgrade: function(creep) {
    let energy = creep.carry.energy;
    if (energy === 0) {
      return FAILED;
    }

    var task = creep.tasks[0];

    var result = creep.upgradeController(task.target);
    if (result === ERR_NOT_IN_RANGE) {
      creep.moveToWithTrail(task.target);
    } else if (result === OK && energy > creep.getActiveBodyparts(WORK)) {
      if (creep.pos.getRangeTo(task.target) >= 3) {
        creep.moveToWithTrail
      }
    } else if (result === OK && energy <= creep.getActiveBodyparts(WORK)) {
      return MOVE_WITHOUT_ENERGY;
    }

    return true;
  },

  assignTask: function(creep) {
    if (creep.carry.energy === 0) {
      creep.tasks = TaskList.getPickupTask(creep, 0);
    } else {
      creep.tasks = TaskList.getWorkTasks(creep);
    }

    return creep.tasks[0];
  },

  run: function(creep) {
    // Pickup nearby jonx
    const nearbyEnergy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
    if (nearbyEnergy.length > 0) {
      creep.pickup(nearbyEnergy[0]);
    }

    if (!creep.tasks.length) {
      Worker.assignTask(creep);
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
          creep.tasks = TaskList.getWorkTasks(creep);
        }
        if (creep.tasks[0]) {
          creep.moveToWithTrail(creep.tasks[0].target);
        }
        return;
      } else if (result === MOVE_WITHOUT_ENERGY) {
        creep.tasks.shift();
        if (!creep.tasks.length) {
          creep.tasks = TaskList.getPickupTask(creep, 0);
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
  },
};

var ACTION_MAP = {
  [Task.PICKUP]: Worker.pickup,
  [Task.WAIT_PICKUP]: Worker.harvest,
  [Task.TRANSFER]: Worker.transfer,
  [Task.REPAIR]: Worker.repair,
  [Task.BUILD]: Worker.build,
  [Task.UPGRADE]: Worker.upgrade,
};

module.exports = Worker;
