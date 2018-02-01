const Rooms = require('Rooms');

const ROAD_REPAIR_HEALTH = 3000;
const RAMPART_HEALTH = 1000;

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
    for (let struct of this.tower.room.find(FIND_STRUCTURES)) {
      if (struct.structureType === STRUCTURE_ROAD &&
          struct.hits < ROAD_REPAIR_HEALTH) {
        this.tower.repair(struct);
        return;
      } else if (struct.structureType === STRUCTURE_RAMPART &&
                 struct.hits < RAMPART_HEALTH) {
        this.tower.repair(struct);
        return;
      }
    }
  }
}

exports.Tower = Tower;
