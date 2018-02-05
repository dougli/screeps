
const WALL_HITS = {
  1: 0,
  2: 0,
  3: 0,
  4: 250000,
  5: 1000000,
  6: 2500000,
  7: 5000000,
  8: 10000000,
};

const WALL_CACHE = {};

const Walls = {
  getHitsFor: function(level) {
    return WALL_HITS[level];
  },

  getWallPlansToBuild: function(room) {
    if (!room || !room.controller ||
        !room.controller.my || Walls.getHitsFor(room.controller.level) <= 0) {
      return [];
    }

    const structures = room.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 49);
    const sites = room.lookForAtArea(LOOK_CONSTRUCTION_SITES, 0, 0, 49, 49);

    return Walls.getWallPlans(room).filter(plan => {
      const structure = (structures[plan.y][plan.x] || [])[0];
      const site = (sites[plan.y][plan.x] || [])[0];
      return !structure && !site;
    });
  },

  getWallPlans: function(room) {
    if (WALL_CACHE[room.name]) {
      return WALL_CACHE[room.name];
    }

    if (!room || !room.controller || !room.controller.my) {
      return [];
    }

    // Find all exit cells
    const exits = [].concat(
      room.lookForAtArea(LOOK_TERRAIN, 0, 0, 0, 49, true),   // TOP
      room.lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 0, true),   // LEFT
      room.lookForAtArea(LOOK_TERRAIN, 49, 0, 49, 49, true), // BOTTOM
      room.lookForAtArea(LOOK_TERRAIN, 0, 49, 49, 49, true)  // RIGHT
    ).filter(cell => cell.terrain === 'plain');

    // BFS for all cells of distance 2
    let queue = exits;
    const map = {};
    for (let range = 0; range <= 2; range++) {
      let newQueue = [];
      for (let cell of queue) {
        let key = cell.x + ',' + cell.y;
        if (key in map || cell.terrain === 'wall') {
          continue;
        }

        map[key] = range;
        if (range !== 2) {
          let nearby = room.lookForAtArea(
            LOOK_TERRAIN,
            Math.max(0, cell.y - 1), Math.max(0, cell.x - 1),
            Math.min(cell.y + 1, 49), Math.min(cell.x + 1, 49),
            true
          );
          Array.prototype.push.apply(newQueue, nearby);
        }
      }
      queue = newQueue;
    }

    const result = [];
    let typeIndex = 0;
    for (let cell in map) {
      if (map[cell] === 2) {
        const pos = cell.split(',');
        result.push({
          x: parseInt(pos[0], 10),
          y: parseInt(pos[1], 10),
          type: typeIndex === 0 ? STRUCTURE_RAMPART : STRUCTURE_WALL,
        });
        typeIndex = (typeIndex + 1) % 3;
      }
    }

    WALL_CACHE[room.name] = result;
    return result;
  },
};

module.exports = Walls;
