class Sources {
  /**
   * Returns the container that represents this source
   */
  static getContainerFor(source) {
    const memory = Sources._getMemoryFor(source);
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

  static getContainerSiteFor(source) {
    if (Sources.getContainerFor(source)) {
      return null;
    }

    const memory = Source._getMemoryFor(source);
    const pos = memory.containerSite;
    if (pos) {
      const site = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y)[0];
      if (site && site.structureType === STRUCTURE_CONTAINER) {
        return site;
      }
    }

    Sources._constructContainerFor(source);
    return null;
  }

  /**
   * Returns Miner creeps assigned to this source.
   */
  static getMinersFor(source) {
    return (source.miners || []);
  }

  static getEnergyPerTick(source) {
    return Math.min(source.energyCapacity / 300);
  }

  static getRemainingMineSpeed(source) {
    const energyPerTick = Sources.getEnergyPerTick(source);
    const speed = Sources.getMinersFor(source)
      .reduce((accum, miner) => accum + miner.getMineSpeed(), 0);
    return Math.max(energyPerTick - speed, 0);
  }

  /**
   * Returns Mule creeps assigned to this source.
   */
  static getMulesFor(source) {
    return (source.mules || []);
  }

  static getRemainingMuleSpeed(source) {
    const energyPerTick = Sources.getEnergyPerTick(source);
    const speed = Sources.getMulesFor(source)
          .reduce((accum, mule) => accum + mule.getMuleSpeed(), 0);
    return Math.max(energyPerTick - speed, 0);
  }

  static _constructContainerFor(source) {
    var spawn = source.room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_SPAWN}
    })[0];

    const path = source.pos.findPathTo(spawn, {ignoreCreeps: true});
    const pos = path[0];
    if (!pos) {
      Game.notify('Can\'t build source container at room ' + room.name, 1440);
    }

    if (pos.createConstructionSite(STRUCTURE_CONTAINER) === OK) {
      Sources._getMemoryFor(source).containerSite = {x: pos.x, y: pos.y};
    } else {
      Game.notify('Can\'t build source container at room ' + room.name, 1440);
    }
  }

  static _getMemoryFor(source) {
    const roomMemory = source.room.memory;
    if (!roomMemory.sources) {
      roomMemory.sources = {};
    }
    if (!roomMemory.sources[source.id]) {
      roomMemory.sources[source.id] = {};
    }
    return roomMemory.sources[source.id];
  }
}

module.exports = Sources;
