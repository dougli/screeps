class Sources {
  /**
   * Returns the container that represents this source
   */
  static getContainerFor(source) {
    const sourceMemory = source.room.memory.sources[source.id];
    return Game.getObjectById(sourceMemory.container);
  }

  /**
   * Returns the Miner creep only if it's nearby.
   */
  static getMinerFor(source) {
    return Sources.getMinersFor(source)[0];
  }

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

  static getMuleFor(source) {
    return source.mule;
  }
}

module.exports = Sources;
