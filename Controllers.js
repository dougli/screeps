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
    const closestSource = controller.pos.findClosestByPath(
      FIND_SOURCES, {ignoreCreeps: true, ignoreRoads: true});

    if (!closestSource) {
      Game.notify('Can\'t build controller container at room ' + room.name, 1440);
      return null;
    }

    // We pick something that's exactly 3 tiles from the controller
    const path = controller.pos.findPathTo(closestSource, {ignoreCreeps: true});
    let pos = null;
    for (var ii = 0; ii < path.length; ii++) {
      if (controller.pos.getRangeTo(path[ii].x, path[ii].y) > 3) {
        break;
      }
      pos = path[ii];
    }
    if (!pos) {
      Game.notify('Can\'t build controller container at room ' + room.name, 1440);
      return null;
    }
    const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
    if (structures.length) {
      if (structures[0].structureType === STRUCTURE_CONTAINER) {
        memory.container = structures[0].id;
        delete memory.containerSite;
        return null;
      }
      Game.notify('Can\'t build controller container at room ' + room.name, 1440);
      return null;
    }

    Controllers._createContainerSiteForAt(controller, pos.x, pos.y);
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

  static _createContainerSiteForAt(controller, x, y) {
    const room = controller.room;
    if (room.createConstructionSite(x, y, STRUCTURE_CONTAINER) === OK) {
      Controllers._getMemory(room).containerSite = {x, y};
    }
  }
}

module.exports = Controllers;
