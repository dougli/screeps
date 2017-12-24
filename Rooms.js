const Task = require('Task');
const Controllers = require('Controllers');

const BUILD_PRIORITY = {
    [STRUCTURE_SPAWN]: 15,
    [STRUCTURE_TOWER]: 14,
    [STRUCTURE_EXTENSION]: 13,
    [STRUCTURE_RAMPART]: 12,
    [STRUCTURE_WALL]: 11,
    [STRUCTURE_ROAD]: 10,
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
