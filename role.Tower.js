const Rooms = require('Rooms');

const MAX_REPAIR_DISTANCE = 10;
const MAX_RAMPART_REPAIR = 1000;

function linterpTowerRange(range) {
  const min = 1 - TOWER_FALLOFF;
  const slope = -TOWER_FALLOFF / (TOWER_FALLOFF_RANGE - TOWER_OPTIMAL_RANGE);
  return Math.min(Math.max(min, 1 + slope * (range - TOWER_OPTIMAL_RANGE)), 1);
}

class Tower {
  constructor(tower) {
    this.tower = tower;
    if (!tower.room.towers) {
      tower.room.towers = [];
    }
    tower.room.towers.push(this);
  }

  getDamageAtRange(range) {
    return TOWER_POWER_ATTACK * linterpTowerRange(range);
  }

  getDamageFor(roomObject) {
    return this.getDamageAtRange(this.tower.pos.getRangeTo(roomObject));
  }

  getHealAtRange(range) {
    return TOWER_POWER_HEAL * linterpTowerRange(range);
  }

  getRepairAtRange(range) {
    return TOWER_POWER_REPAIR * linterpTowerRange(range);
  }

  // Towers attack through coordinated DefenseMissions
  attack(thing) {
    this._ordered = true;
    return this.tower.attack(thing);
  }

  run() {
    if (this._ordered) {
      return;
    }

    const pos = this.tower.pos;

    const tasks = Rooms.getRepairTasks(this.tower.room);
    for (const task of tasks) {
      if (pos.getRangeTo(task.target) <= MAX_REPAIR_DISTANCE) {
        this.tower.repair(task.target);
      } else if (task.target.structureType === STRUCTURE_RAMPART &&
                 task.target.hits < 500) {
        this.tower.repair(task.target);
      }
    }
  }
}

module.exports = Tower;
