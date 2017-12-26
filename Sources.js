class Sources {
  /**
   * Returns the container that represents this source
   */
  static getContainerFor(source) {
    const sourceMemory = source.room.memory.sources[source.id];
    return Game.getObjectById(sourceMemory.container);
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
