const Paths = require('Paths');

class Sources {
  /**
   * Returns the container that represents this source
   */
  static getContainerFor(source) {
    const memory = Sources.getMemoryFor(source);
    if (memory.container) {
      return Game.getObjectById(memory.container);
    }

    if (memory.containerSite) {
      const room = source.room;
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

    const room = source.room;
    const memory = Sources.getMemoryFor(source);
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
  static getMinersFor(source, ignoreDyingCreeps) {
    let result = (source.miners || []);
    if (ignoreDyingCreeps) {
      result = result.filter((miner) => !miner.isDyingSoon());
    }
    return result;
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
    const room = source.room;
    const spawn = room.find(FIND_MY_STRUCTURES, {
      filter: {structureType: STRUCTURE_SPAWN}
    })[0];

    let pos = null;

    if (spawn) {
      const path = source.pos.findPathTo(spawn, {ignoreCreeps: true});
      pos = path[0];
      if (!pos) {
        Game.notify('Can\'t build source container at room ' + room.name, 1440);
      }
    } else {
      const nearby = room.lookForAtArea(
        LOOK_TERRAIN,
        source.pos.y - 1,
        source.pos.x - 1,
        source.pos.y + 1,
        source.pos.x + 1,
        true);

      for (let terrain of nearby) {
        if (terrain.terrain !== 'wall') {
          pos = new RoomPosition(terrain.x, terrain.y, room.name);
          break;
        }
      }
    }
    pos && Sources._constructContainerAtPos(source, pos);
  }

  static _constructContainerAtPos(source, pos) {
    const room = source.room;

    // If the site is already there but not in memory
    const struct = room.lookForAt(LOOK_STRUCTURES, pos.x, pos.y)[0];
    if (struct && struct.structureType == STRUCTURE_CONTAINER) {
      Sources.getMemoryFor(source).container = struct.id;
      return;
    }

    const site = room.lookForAt(LOOK_CONSTRUCTION_SITES, pos.x, pos.y)[0];
    if (site && site.my && site.structureType == STRUCTURE_CONTAINER) {
      Sources.getMemoryFor(source).containerSite = {x: pos.x, y: pos.y};
      return;
    }

    if (room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER) === OK) {
      Sources.getMemoryFor(source).containerSite = {x: pos.x, y: pos.y};
    } else {
      Game.notify('Can\'t build source container at room ' + room.name, 1440);
    }
  }

  static getMemoryFor(source) {
    const roomMemory = source.room.memory;
    if (!roomMemory.sources) {
      roomMemory.sources = {};
    }
    if (!roomMemory.sources[source.id]) {
      roomMemory.sources[source.id] = {x: source.pos.x, y: source.pos.y};
    }

    // Migration code
    if (!roomMemory.sources[source.id].x) {
      roomMemory.sources[source.id].x = source.pos.x;
      roomMemory.sources[source.id].y = source.pos.y;
    }
    return roomMemory.sources[source.id];
  }

  static getSourcePosition(roomName, id) {
    let mem = Memory.rooms[roomName];
    if (mem && mem.sources && mem.sources[id] && mem.sources[id].x) {
      let sourceMem = mem.sources[id];
      return new RoomPosition(sourceMem.x, sourceMem.y, roomName);
    }
    return null;
  }
}

module.exports = Sources;
