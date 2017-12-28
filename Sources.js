class Sources {
  /**
   * Returns the container that represents this source
   */
  static getContainerFor(source) {
    const memory = source.room.memory.sources[source.id];
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
    const memory = source.room.memory.sources[source.id];
    const pos = memory.containerSite;
    if (pos) {
      const site = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y)[0];
      if (site && site.structureType === STRUCTURE_CONTAINER) {
        return site;
      }
    }
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
}

module.exports = Sources;
