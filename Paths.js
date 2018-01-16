const Profiler = require('Profiler');

const IMPASSABLE = 255;

/**
 * Options supported:
 *
 * ignoreHostile: array - Hostile rooms that we should enter. The default is [].
 *
 * ignoreCreeps: boolean - If true, creeps will be treated as walkable. Useful
 *     for road building. The default is false.
 *
 * ignoreTerrain: boolean - If true, cost of plains and swamps will be set to
 *     1. Useful for road building or for scout units that only have move
 *     parts. The default is false.
 */
class Paths {
  static search(origin, goal, options) {
    const opts = Object.assign({
      ignoreHostile: [],
      ignoreCreeps: false,
      ignoreTerrain: false
    }, options);

    const result = PathFinder.search(origin, goal, {
      plainCost: opts.ignoreTerrain ? 1 : 2,
      swampCost: opts.ignoreTerrain ? 1 : 10,
      roomCallback: (roomName) => {
        const mem = Memory.rooms[roomName];
        if (mem && mem.hostile && opts.ignoreHostile.indexOf(roomName) < 0) {
          return false;
        }

        const room = Game.rooms[roomName];
        if (!room) {
          return;
        }

        const costs = new PathFinder.CostMatrix();
        room.find(FIND_STRUCTURES).forEach((struct) => {
          const c = Paths._cost(struct);
          if (c !== null) {
            costs.set(struct.pos.x, struct.pos.y, c);
          }
        });

        if (!opts.ignoreCreeps) {
          room.find(FIND_CREEPS).forEach((creep) => {
            costs.set(creep.pos.x, creep.pos.y, IMPASSABLE);
          });
        }

        room.find(FIND_MY_CONSTRUCTION_SITES).forEach((site) => {
          if (site.structureType !== STRUCTURE_ROAD &&
              site.structureType !== STRUCTURE_CONTAINER) {
            costs.set(site.pos.x, site.pos.y, IMPASSABLE);
          }
        });

        return costs;
      }
    }).path;

    result.unshift(origin);
    return result;
  }

  static isWalkable(object) {
    return Paths._cost(object) !== IMPASSABLE;
  }

  static serialize(path) {
    const result = [];

    let room = null;
    let prev = null;
    let curr = null;
    for (const pos of path) {
      if (pos.roomName != room) {
        curr = [pos.roomName, pos.x, pos.y, ''];
        room = pos.roomName;
        result.push(curr);
      } else if (prev) {
        curr[3] += prev.getDirectionTo(pos);
      }
      prev = pos;
    }

    return result;
  }

  static draw(path) {
    let roomPoints = [];
    let prevRoom = null;

    for (const pos of path) {
      if (prevRoom !== pos.roomName) {
        if (prevRoom) {
          new RoomVisual(prevRoom).poly(roomPoints, {lineStyle: 'dashed'});
        }
        prevRoom = pos.roomName;
        roomPoints = [];
      }
      roomPoints.push(pos);
    }

    if (roomPoints.length) {
      new RoomVisual(prevRoom).poly(roomPoints, {lineStyle: 'dashed'});
    }
  }

  static _cost(o) {
    if (o instanceof Creep ||
        o instanceof Source ||
        o instanceof Mineral) {
      return IMPASSABLE;
    } else if (o instanceof Structure) {
      switch (o.structureType) {
      case STRUCTURE_ROAD:
        return 1;
      case STRUCTURE_CONTAINER:
        return null;
      case STRUCTURE_RAMPART:
        return o.my ? null : IMPASSABLE;
      }
      return IMPASSABLE;
    } else if (o instanceof ConstructionSite) {
      if (!o.my ||
          site.structureType === STRUCTURE_ROAD ||
          site.structureType === STRUCTURE_CONTAINER ||
          site.structureType === STRUCTURE_RAMPART) {
        return null;
      }
      return IMPASSABLE;
    }

    return null;
  }
}

Profiler.registerObject(Paths, 'Paths');

module.exports = Paths;
