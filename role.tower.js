const Rooms = require('Rooms');

const MAX_REPAIR_DISTANCE = 10;

class Tower {
  constructor(tower) {
    this.tower = tower;
  }

  run() {
    const pos = this.tower.pos;

    // 1. Find and attack hostiles
    const closestHostile = pos.findClosestByRange(FIND_HOSTILE_CREEPS);
    if (closestHostile) {
      this.tower.attack(closestHostile);
      return;
    }

    // 2. Otherwise, if there are buildings to repair near the tower, fix them
    const tasks = Rooms.getRepairTasks(this.tower.room);
    for (const task of tasks) {
      if (pos.getRangeTo(task.target) <= MAX_REPAIR_DISTANCE) {
        this.tower.repair(task.target);
        return;
      }
    }
  }
}

module.exports = Tower;
