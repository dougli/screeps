const Task = require('Task');
const Controllers = require('Controllers');

const BUILD_PRIORITY = {
    [STRUCTURE_TOWER]: 15,
    [STRUCTURE_EXTENSION]: 14,
    [STRUCTURE_SPAWN]: 13,
    [STRUCTURE_STORAGE]: 12,
    [STRUCTURE_LINK]: 11,
    [STRUCTURE_OBSERVER]: 10,
    [STRUCTURE_LAB]: 9,
    [STRUCTURE_TERMINAL]: 8,
    [STRUCTURE_NUKER]: 7,
    [STRUCTURE_RAMPART]: 6,
    [STRUCTURE_WALL]: 5,
    [STRUCTURE_ROAD]: 4,
    [STRUCTURE_POWER_SPAWN]: 3,
};

class Rooms {
  static getBuilderFor(room) {
    return room.builder;
  }

  static getBuildTasks(room) {
    const result = [];

    var sites = room.find(FIND_CONSTRUCTION_SITES);
    sites.forEach(function(site) {
      var amount = site.progressTotal - site.progress;
      var priority = BUILD_PRIORITY[site.structureType];
      if (priority) {
        result.push(new Task(Task.BUILD, site, amount, 1, priority));
      }
    });

    return result.sort(Task.compare);
  }

  static getRepairTasks(room) {
    if (!room.controller || !room.controller.my) {
      return [];
    }

    const result = [];
    const structures = room.find(FIND_STRUCTURES);
    for (const structure of structures) {
      const amount = structure.hitsMax - structure.hits;
      if (amount === 0) {
        continue;
      }

      if (structure.my) {
        result.push(new Task(Task.REPAIR, structure, amount));
      } else if (structure.structureType === STRUCTURE_ROAD) {
        if (amount >= 1000) {
          result.push(new Task(Task.REPAIR, structure, amount));
        }
      }
    }

    return result;
  }

  static getDropoffTasks(room) {
    const result = [];

    // First, prioritize structures that need juice
    var structures = room.find(FIND_MY_STRUCTURES);
    structures.forEach((structure) => {
      let amount = structure.energyCapacity - structure.energy;
      if (amount > 0) {
        result.push(new Task(Task.TRANSFER, structure, amount));
      }
    });
    if (result.length > 0) {
      return result;
    }

    // Then, prioritize builders
    if (!room.controller || room.controller.ticksToDowngrade > 2000) {
      const builder = Rooms.getBuilderFor(room);
      if (builder && builder.hasTask()) {
        return [new Task(Task.TRANSFER, builder.creep, 1000)];
      }
    }

    // Finally, prioritize upgraders
    const upgradeContainer = Controllers.getContainerFor(room.controller);
    if (upgradeContainer) {
      return [new Task(Task.TRANSFER, upgradeContainer, 1000)];
    }
    const upgrader = Controllers.getUpgradersFor(room.controller)[0];
    if (upgrader) {
      return [new Task(Task.TRANSFER, upgrader.creep, 1000)];
    }

    return [];
  }
}

module.exports = Rooms;
