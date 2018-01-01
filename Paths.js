const Profiler = require('Profiler');

const IMPASSABLE = 255;

class Paths {
  static search(origin, goal, opts) {
    opts = opts || {};

    return PathFinder.search(origin, goal, {
      plainCost: 2,
      swampCost: 10,
      roomCallback: (roomName) => {
        const room = Game.rooms[roomName];
        if (!room) {
          return;
        }

        const costs = new PathFinder.CostMatrix();
        room.find(FIND_STRUCTURES).forEach((struct) => {
          switch (struct.structureType) {
          case STRUCTURE_ROAD:
            costs.set(struct.pos.x, struct.pos.y, 1);
            break;
          case STRUCTURE_CONTAINER:
            break;
          case STRUCTURE_RAMPART:
            if (!struct.my) {
              costs.set(struct.pos.x, struct.pos.y, IMPASSABLE);
            }
            break;
          default:
            costs.set(struct.pos.x, struct.pos.y, IMPASSABLE);
          }
        });

        if (!opts.ignoreCreeps) {
          room.find(FIND_CREEPS).forEach((creep) => {
            costs.set(creep.pos.x, creep.pos.y, IMPASSABLE);
          });
        }

        room.find(FIND_MY_CONSTRUCTION_SITES).forEach((site) => {
          const cost = site.structureType === STRUCTURE_ROAD ? 1 : IMPASSABLE;
          costs.set(site.pos.x, site.pos.y, cost);
        });

        return costs;
      }
    });
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
}

Profiler.registerObject(Paths, 'Paths');

module.exports = Paths;
