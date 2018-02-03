import * as Profiler from 'Profiler';

const MATRIX_CACHE: {[room: string]: {matrix: CostMatrix, time: number}} = {};
const IMPASSABLE = 255;

function _cost(o: any): 1 | 255 | null {
  if (o instanceof Structure) {
    switch (o.structureType) {
    case STRUCTURE_ROAD:
      return 1;
    case STRUCTURE_CONTAINER:
      return null;
    case STRUCTURE_RAMPART:
      return (o as StructureRampart).my ? null : IMPASSABLE;
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

type Goal = RoomPosition | {pos: RoomPosition, range: number};

interface PathOptions {
  // Hostile rooms that we should enter. The default is [].
  ignoreHostile?: string[];

  // If true, creeps will be treated as walkable. Useful for road building. The
  // default is false.
  ignoreCreeps?: boolean;

  // If true, cost of plains and swamps will be set to 1. Useful for road
  // building or for scout units that only have move parts. The default is
  // false.
  ignoreTerrain?: boolean;

  // If true, cost of plains and swamps will be set to 1 and 5,
  // respectively. Useful for creeps designed to go off-road (1 MOVE part per
  // other part). The default is false.
  ignoreRoads?: false;

  // Whether to force a new
  freshMatrix?: false;
}

class Paths {
  public static search(
    origin: RoomPosition,
    goal: Goal[] | Goal,
    options: PathOptions,
  ): PathFinderPath {
    const opts = Object.assign({
      freshMatrix: false,
      ignoreCreeps: false,
      ignoreHostile: [],
      ignoreRoads: false,
      ignoreTerrain: false,
    }, options);

    let sameRoom = true;
    const goals = Array.isArray(goal) ? goal : [goal];
    for (const goalDef of goals) {
      const pos = goalDef instanceof RoomPosition ? goalDef : goalDef.pos;
      if (origin.roomName !== pos.roomName) {
        sameRoom = false;
        break;
      }
    }

    const result = PathFinder.search(origin, goal, {
      plainCost: opts.ignoreTerrain ? 1 : (opts.ignoreRoads ? 1 : 2),

      swampCost: opts.ignoreTerrain ? 1 : (opts.ignoreRoads ? 5 : 10),

      heuristicWeight: opts.ignoreTerrain || opts.ignoreRoads ? 1 : 1.5,

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
        for (const creep of room.find(FIND_CREEPS)) {
          matrix.set(creep.pos.x, creep.pos.y, IMPASSABLE);
        }

        return matrix;
      },
    });

    result.path.unshift(origin);
    return result;
  }

  private static _getStructureMatrix(
    roomName: string,
    freshMatrix: boolean,
  ): CostMatrix {
    const cache = MATRIX_CACHE[roomName];
    if (cache && (!freshMatrix || cache.time === Game.time)) {
      return cache.matrix;
    }

    const room = Game.rooms[roomName];
    if (!room) {
      return new PathFinder.CostMatrix();
    }

    const matrix = new PathFinder.CostMatrix();

    for (const struct of room.find(FIND_STRUCTURES)) {
      const c = _cost(struct);
      if (c !== null) {
        matrix.set(struct.pos.x, struct.pos.y, c);
      }
    }

    for (const site of room.find(FIND_MY_CONSTRUCTION_SITES)) {
      const c = _cost(site);
      if (c !== null) {
        matrix.set(site.pos.x, site.pos.y, c);
      }
    }

    MATRIX_CACHE[roomName] = {matrix, time: Game.time};
    return matrix;
  }

  public static isWalkable(object: any): boolean {
    return _cost(object) !== IMPASSABLE;
  }

  public static serialize(path: RoomPosition[]): string {
    let result = '';
    let room: string | null = null;
    let prev: RoomPosition | null = null;
    for (const pos of path) {
      if (pos.roomName !== room) {
        room = pos.roomName;
      } else if (prev) {
        result += prev.getDirectionTo(pos);
      }
      prev = pos;
    }

    return result;
  }

  public static draw(path: RoomPosition[]): void {
    let roomPoints: RoomPosition[] = [];
    let prevRoom: string | null = null;

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

    if (roomPoints.length && prevRoom) {
      new RoomVisual(prevRoom).poly(roomPoints, {lineStyle: 'dashed'});
    }
  }
}

Profiler.registerObject(Paths, 'Paths');

export { Paths };
export default Paths; // TODO: Kill. Here only for backwards compatibility
