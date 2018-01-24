const Paths = require('Paths');

const MUST_REPAIR_CONTAINER = 200000;

class Controllers {
  static _getMemory(room) {
    if (!(room instanceof Room)) {
      throw Exception('Expected Room');
    }

    if (!room.memory.controller) {
      room.memory.controller = {};
    }

    return room.memory.controller;
  }

  static getOwner(controller) {
    if (!controller) {
      return null;
    } else if (controller.owner) {
      return controller.owner.username;
    }
    if (controller.reservation) {
      return controller.reservation.username;
    }
    return null;
  }

  static getUpgradersFor(controller) {
    return (controller.upgraders || []);
  }

  static getUpgradeSpeed(controller) {
    const upgradeSpeed = Controllers.getUpgradersFor(controller)
          .reduce((accum, upgrader) => accum + upgrader.getUpgradeSpeed(), 0);

    return upgradeSpeed;
  }

  static getContainerFor(controller) {
    const room = controller.room;
    const memory = Controllers._getMemory(room);

    if (memory.container) {
      return Game.getObjectById(memory.container);
    }

    if (memory.containerSite) {
      const pos = memory.containerSite;
      const structure = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y)[0];
      if (structure && structure.structureType == STRUCTURE_CONTAINER) {
        memory.container = structure.id;
        delete memory.containerSite;
        return structure;
      }
    }

    return null;
  }

  static getContainerSiteFor(controller) {
    if (Controllers.getContainerFor(controller)) {
      return null;
    }

    // Fetch from memory
    const room = controller.room;
    const memory = Controllers._getMemory(room);
    if (memory.containerSite) {
      const pos = memory.containerSite;
      const site = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y)[0];
      if (site && site.structureType === STRUCTURE_CONTAINER) {
        return site;
      }
    }

    // Otherwise, create a new one by placing the container towards the nearest
    // source
    const sources = room.find(FIND_SOURCES);

    // We pick something that's exactly 3 tiles from the controller
    const pos = Controllers._findPathDist(controller, sources, 3);
    if (!pos) {
      Game.notify('Can\'t build controller container at room ' + room.name, 1440);
      return null;
    }

    if (Controllers._createSiteAt(controller, pos, STRUCTURE_CONTAINER)) {
      memory.containerSite = {x: pos.x, y: pos.y};
    }
    return null;
  }

  static getLinkFor(controller) {
    if (controller.level < 5) {
      return null;
    }

    const room = controller.room;
    const memory = Controllers._getMemory(room);

    if (memory.link) {
      return Game.getObjectById(memory.link);
    }

    if (memory.linkSite) {
      const pos = memory.linkSite;
      const structure = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y)[0];
      if (structure &&
          structure.my &&
          structure.structureType == STRUCTURE_LINK) {
        memory.link = structure.id;
        delete memory.linkSite;
        return structure;
      }
    }

    return null;
  }

  static getLinkSiteFor(controller) {
    if (Controllers.getLinkFor(controller) || controller.level < 5) {
      return null;
    }

    // Fetch from memory
    const room = controller.room;
    const memory = Controllers._getMemory(room);
    if (memory.linkSite) {
      const pos = memory.linkSite;
      const site = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y)[0];
      if (site && site.my && site.structureType === STRUCTURE_LINK) {
        return site;
      }
    }

    const spawns = room.find(FIND_MY_SPAWNS);
    if (!spawns.length) {
      Game.notify('Can\'t build controller link at room ' + room.name, 1440);
      return null;
    }

    // Pick a position 2 steps from the controller
    const pos = Controllers._findPathDist(controller, spawns, 2);
    if (!pos) {
      Game.notify('Can\'t build controller link at room ' + room.name, 1440);
      return null;
    }

    if (Controllers._createSiteAt(controller, pos, STRUCTURE_LINK)) {
      memory.linkSite = {x: pos.x, y: pos.y};
    }
    return null;
  }

  static mustPrioritizeUpgrade(controller) {
    if (!controller || !controller.my) {
      return false;
    }

    if (controller.ticksToDowngrade <= 2000) {
      return true;
    }

    const container = Controllers.getContainerFor(controller);
    return (container && container.hits < MUST_REPAIR_CONTAINER);
  }

  static _findPathDist(controller, targets, distance) {
    const path = Paths.search(
      controller.pos,
      targets.map(target => ({pos: target.pos, range: 1})),
      {ignoreCreeps: true, ignoreTerrain: true}
    ).path;

    let pos = null;
    for (var ii = 0; ii < path.length; ii++) {
      if (controller.pos.getRangeTo(path[ii]) > distance) {
        break;
      }
      pos = path[ii];
    }
    return pos;
  }

  static _createSiteAt(controller, pos, type) {
    const structure = pos.lookFor(LOOK_STRUCTURES)[0];
    if (structure) {
      if (structure.structureType === type &&
          (structure.my || type === STRUCTURE_CONTAINER)) {
        return true;
      }
      Game.notify('Can\'t build controller ' + type + ' at ' + pos, 1440);
      return false;
    }

    if (pos.createConstructionSite(type) === OK) {
      return true;
    }

    Game.notify('Can\'t build controller ' + type + ' at ' + pos, 1440);
    return false;
  }
}

module.exports = Controllers;
