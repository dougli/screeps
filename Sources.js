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
    return source.miner;
  }

  static getMuleFor(source) {
    return source.mule;
  }
}

module.exports = Sources;
