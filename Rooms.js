const Task = require('Task');
const Controllers = require('Controllers');
const BaseLayout = require('BaseLayout');
const Walls = require('Walls');

const MIN_STORAGE_ENERGY = 1000;
const TARGET_STORAGE_ENERGY = 50000;
const TERMINAL_ENERGY = 10000;
const MIN_WALL_REPAIR = 25000;

class Rooms {
  static getBuilderFor(room) {
    return room.builder;
  }

  static getRepairerFor(room) {
    return room.repairer;
  }

  static getReloadersFor(room) {
    return room.reloaders || {};
  }

  static getFriendlyTowers(room) {
    return room.towers || [];
  }

  static getDefenseMission(room) {
    return room.defenseMission;
  }

  static getScoutMissionFrom(room) {
    return room.scoutMission;
  }

  static getMissingReloaders(room) {
    if (!room.storage || !room.storage.my) {
      return [];
    }

    const quadrants = BaseLayout.getActiveQuadrants(room);
    const reloaders = Rooms.getReloadersFor(room);
    const result = [];
    for (const quadrant of quadrants) {
      if (!reloaders[quadrant]) {
        result.push(quadrant);
      }
    }
    return result;
  }

  static getBuildTasks(room) {
    const result = [];

    var sites = room.find(FIND_MY_CONSTRUCTION_SITES);
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

  static getBuildDefenseTasks(room, pos) {
    const result = [];

    let sites = room.find(FIND_MY_CONSTRUCTION_SITES).filter(site => {
      return site.structureType === STRUCTURE_RAMPART ||
        site.structureType === STRUCTURE_WALL;
    });

    pos && sites.sort((a, b) => pos.getRangeTo(a) - pos.getRangeTo(b));
    return sites.map(site => new Task(Task.BUILD, site, 1));
  }

  static getRepairerTasks(room, pos) {
    if (!room.controller || !room.controller.my) {
      return [];
    }

    // Don't do anything if the room isn't ready for walls yet
    const wallHitsMax = Walls.getHitsFor(room.controller.level);
    if (wallHitsMax <= 0) {
      return [];
    }

    // Get all the walls and ramparts I own
    const walls = room.find(FIND_STRUCTURES).filter(structure => {
      if (structure.structureType !== STRUCTURE_RAMPART &&
          structure.structureType !== STRUCTURE_WALL) {
        return false;
      } else if (structure.hits > wallHitsMax) {
        return false;
      }
      return structure.my || structure.structureType === STRUCTURE_WALL;
    });

    const avgHP = walls.reduce((accum, wall) => accum + wall.hits, 0) /
          walls.length;

    let result = [];
    for (const wall of walls) {
      if (wall.hits <= avgHP) {
        const targetHP = Math.max(avgHP + MIN_WALL_REPAIR, avgHP * 1.1);
        result.push(new Task(Task.REPAIR, wall, targetHP));
      }
    }

    if (pos) {
      result.sort((a, b) => {
        return pos.getRangeTo(a.target) - pos.getRangeTo(b.target);
      });
    }
    return result;
  }

  static getReloadTasks(reloader, room) {
    const quadrant = reloader.getQuadrant();
    const toRefill = BaseLayout.getQuadrantEnergyStructures(room, quadrant)
      .filter((structure) => {
        switch (structure.structureType) {
        case STRUCTURE_TOWER:
          return structure.energy < structure.energyCapacity * 0.8;
        case STRUCTURE_TERMINAL:
          return structure.store[RESOURCE_ENERGY] < TERMINAL_ENERGY;
        default:
          return structure.energy < structure.energyCapacity;
        }
      });

    let result = toRefill.map((structure) => {
      return new Task(Task.TRANSFER, structure, 300);
    });

    const pos = reloader.creep.pos;
    result = result.sort((a, b) => {
      const distA = pos.getRangeTo(a.target);
      const distB = pos.getRangeTo(b.target);
      return distA - distB;
    });
    return result;
  }

  static getDropoffTasks(room, pos) {
    let result = [];

    // First, prioritize storage or spawns & extensions that need juice
    const storage = room.storage;
    const hasReloaders = Object.keys(Rooms.getReloadersFor(room)).length > 0;
    const mustPrioritizeUpgrade =
          Controllers.mustPrioritizeUpgrade(room.controller);

    if (storage && storage.my && hasReloaders) {
      const amount =
            (mustPrioritizeUpgrade ? MIN_STORAGE_ENERGY : TARGET_STORAGE_ENERGY) -
            storage.store[RESOURCE_ENERGY];
      if (amount > 0) {
        return [new Task(Task.TRANSFER, storage, amount)];
      }
    } else {
      var structures = room.find(FIND_MY_STRUCTURES);
      structures.forEach((structure) => {
        let amount = structure.energyCapacity - structure.energy;
        if (amount > 0) {
          result.push(new Task(Task.TRANSFER, structure, amount));
        }
      });
      if (result.length > 0 && pos) {
        result = result.sort((a, b) => {
          const distA = pos.getRangeTo(a.target);
          const distB = pos.getRangeTo(b.target);
          return distA - distB;
        });
        return result;
      }
    }

    // Then, prioritize builders
    if (!mustPrioritizeUpgrade) {
      const builder = Rooms.getBuilderFor(room);
      if (builder && builder.hasTask() && builder.isNearTask()) {
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
