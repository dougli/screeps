const Profiler = require('Profiler');

const MATRIX_CACHE = {};
const IMPASSABLE = 255;

function _cost(o) {
  if (o instanceof Structure) {
    switch (o.structureType) {
    case STRUCTURE_ROAD:
      return 1;
    case STRUCTURE_CONTAINER:
      return null;
    case STRUCTURE_RAMPART:
      return o.my ? null : IMPASSABLE;
    }
    return IMPASSABLE;
  } else if (o instanceof Creep ||
             o instanceof Source ||
             o instanceof Mineral) {
    return IMPASSABLE;
  } else if (o instanceof ConstructionSite) {
    if (!o.my ||
        o.structureType === STRUCTURE_ROAD ||
        o.structureType === STRUCTURE_CONTAINER ||
        o.structureType === STRUCTURE_RAMPART) {
      return null;
    }
    return IMPASSABLE;
  }

  return null;
}

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
 *
 * ignoreRoads: boolean - If true, cost of plains and swamps will be set to 1
 *     and 5, respectively. Useful for creeps designed to go off-road (1 MOVE
 *     part per other part). The default is false.
 */
const Paths = {
  search: function(origin, goal, options) {
    const opts = Object.assign({
      ignoreHostile: [],
      ignoreCreeps: false,
      ignoreTerrain: false,
      ignoreRoads: false,
      freshMatrix: false,
    }, options);

    let sameRoom = true;
    const goals = [];
    if (goal instanceof RoomPosition) {
      goals = [goal];
    } else {
      goals = Array.isArray(goal.pos) ? goal.pos : [goal.pos];
    }
    for (let goalPos of goals) {
      if (origin.roomName !== goalPos.roomName) {
        sameRoom = false;
        break;
      }
    }

    const result = PathFinder.search(origin, goal, {
      plainCost: opts.ignoreTerrain ? 1 : (opts.ignoreRoads ? 1 : 2),

      swampCost: opts.ignoreTerrain ? 1 : (opts.ignoreRoads ? 5 : 10),

      roomCallback: (roomName) => {
        if (sameRoom && roomName !== origin.roomName) {
          return false;
        }

        const mem = Memory.rooms[roomName];
        if (mem && mem.hostile && opts.ignoreHostile.indexOf(roomName) < 0) {
          return false;
        }

        if (origin.roomName !== roomName || opts.ignoreCreeps) {
          return Paths._getStructureMatrix(roomName, opts.freshMatrix);
        }

        const matrix = Paths._getStructureMatrix(roomName, opts.freshMatrix)
          .clone();

        const room = Game.rooms[roomName];
        for (let creep of room.find(FIND_CREEPS)) {
          matrix.set(creep.pos.x, creep.pos.y, IMPASSABLE);
        }

        return matrix;
      }
    });

    result.path.unshift(origin);
    return result;
  },

  _getStructureMatrix: function(roomName, freshMatrix) {
    const cache = MATRIX_CACHE[roomName];
    if (cache && (!freshMatrix || cache.time === Game.time)) {
      return cache.matrix;
    }

    const room = Game.rooms[roomName];
    if (!room) {
      return;
    }

    const matrix = new PathFinder.CostMatrix();

    for (let struct of room.find(FIND_STRUCTURES)) {
      const c = _cost(struct);
      if (c !== null) {
        matrix.set(struct.pos.x, struct.pos.y, c);
      }
    }

    for (let site of room.find(FIND_MY_CONSTRUCTION_SITES)) {
      const c = _cost(site);
      if (c !== null) {
        matrix.set(site.pos.x, site.pos.y, c);
      }
    }

    MATRIX_CACHE[roomName] = {matrix, time: Game.time};
    return matrix;
  },

  isWalkable: function(object) {
    return _cost(object) !== IMPASSABLE;
  },

  serialize: function(path) {
    let result = '';
    let room = null;
    let prev = null;
    for (const pos of path) {
      if (pos.roomName != room) {
        room = pos.roomName;
      } else if (prev) {
        result += prev.getDirectionTo(pos);
      }
      prev = pos;
    }

    return result;
  },

  draw: function(path) {
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
};

Profiler.registerObject(Paths, 'Paths');

module.exports = Paths;
