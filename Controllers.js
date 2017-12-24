class Controllers {
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
    const memory = room.memory.controller;
    if (!memory) {
      return null;
    }

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
    if (room.memory.controller && room.memory.controller.containerSite) {
      const pos = room.memory.controller.containerSite;
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

    const path = controller.pos.findPathTo(closestSource);
    const pos = path[1];
    if (!pos) {
      Game.notify('Can\'t build controller container at room ' + room.name, 1440);
      return null;
    }
    const structures = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y);
    if (structures.length) {
      Game.notify('Can\'t build controller container at room ' + room.name, 1440);
      return null;
    }

    Controllers._createContainerSiteForAt(controller, pos.x, pos.y);
    return null;
  }

  static _createContainerSiteForAt(controller, x, y) {
    const room = controller.room;
    if (room.createConstructionSite(x, y, STRUCTURE_CONTAINER) === OK) {
      if (!room.memory.controller) {
        room.memory.controller = {};
      }

      room.memory.controller.containerSite = {x, y};
    }
  }
}

module.exports = Controllers;
