const Task = require('Task');
const Controllers = require('Controllers');
const BaseLayout = require('BaseLayout');

class Rooms {
  static getBuilderFor(room) {
    return room.builder;
  }

  static getBuildTasks(room) {
    const result = [];

    var sites = room.find(FIND_CONSTRUCTION_SITES);
    const priorities = BaseLayout.getPriorityMap();
    sites.forEach(function(site) {
      var amount = site.progressTotal - site.progress;
      var priority = priorities[site.structureType];
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

  static getDropoffTasks(creep) {
    let result = [];
    const room = creep.room;

    // First, prioritize structures that need juice
    var structures = room.find(FIND_MY_STRUCTURES);
    structures.forEach((structure) => {
      let amount = structure.energyCapacity - structure.energy;
      if (amount > 0) {
        result.push(new Task(Task.TRANSFER, structure, amount));
      }
    });
    if (result.length > 0) {
      const pos = creep.pos;
      result = result.sort((a, b) => {
        const distA = pos.getRangeTo(a.target);
        const distB = pos.getRangeTo(b.target);
        return distA - distB;
      });
      return result;
    }

    // Then, prioritize builders
    if (!Controllers.mustPrioritizeUpgrade(room.controller)) {
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
