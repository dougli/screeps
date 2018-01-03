const Profiler = require('Profiler');

const BUILD_PRIORITY = {
  [STRUCTURE_TOWER]: 15,
  [STRUCTURE_EXTENSION]: 14,
  [STRUCTURE_SPAWN]: 13,
  [STRUCTURE_STORAGE]: 12,
  [STRUCTURE_LINK]: 11,
  [STRUCTURE_OBSERVER]: 10,
  [STRUCTURE_LAB]: 9,
  [STRUCTURE_TERMINAL]: 8,
  [STRUCTURE_NUKER]: 7,
  [STRUCTURE_RAMPART]: 6,
  [STRUCTURE_WALL]: 5,
  [STRUCTURE_ROAD]: 4,
  [STRUCTURE_POWER_SPAWN]: 3,
};

function s(structureType, roomLevel) {
  return {s: structureType, l: roomLevel};
}

const SIZE = 13;
const BASE_LAYOUT = [
/*  1 */  [null, s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4)],
/*  2 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_OBSERVER, 8), s(STRUCTURE_LAB, 8), s(STRUCTURE_LAB, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), null, s(STRUCTURE_ROAD, 4)],
/*  3 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_LAB, 8), s(STRUCTURE_LAB, 7), s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 7), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 4)],
/*  4 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_LAB, 8), s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 6), s(STRUCTURE_LAB, 6), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 4)],
/*  5 */  [s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 4), s(STRUCTURE_LAB, 7), s(STRUCTURE_LAB, 6), s(STRUCTURE_TERMINAL, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_POWER_SPAWN, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 7)],
/*  6 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 4), s(STRUCTURE_TOWER, 8), s(STRUCTURE_ROAD, 5), null, s(STRUCTURE_ROAD, 4), s(STRUCTURE_NUKER, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 4)],
/*  7 */  [s(STRUCTURE_ROAD, 8), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_LINK, 5), s(STRUCTURE_ROAD, 3), s(STRUCTURE_STORAGE, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_TOWER, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 8)],
/*  8 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_TOWER, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 1), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 8), s(STRUCTURE_ROAD, 5), s(STRUCTURE_TOWER, 7), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 4)],
/*  9 */  [s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_TOWER, 5), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 7), s(STRUCTURE_ROAD, 5), s(STRUCTURE_TOWER, 8), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 6)],
/* 10 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 4)],
/* 11 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 4)],
/* 12 */  [s(STRUCTURE_ROAD, 4), null, s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 6), null, s(STRUCTURE_ROAD, 4)],
/* 13 */  [null, s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 8), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4)]
];

class BaseLayout {
  static getPriorityMap() {
    return BUILD_PRIORITY;
  }

  static getConstructionPlans(room) {
    if (!room || !room.controller || !room.controller.my) {
      return [];
    }

    const level = room.controller.level;
    const pos = BaseLayout.getBasePos(room);
    if (!pos) {
      return [];
    }

    const structures = room.lookForAtArea(
      LOOK_STRUCTURES, pos.y, pos.x, pos.y + SIZE - 1, pos.x + SIZE - 1
    );
    const sites = room.lookForAtArea(
      LOOK_CONSTRUCTION_SITES, pos.y, pos.x, pos.y + SIZE - 1, pos.x + SIZE - 1
    );

    return BaseLayout.getBasePlans(pos.x, pos.y, level, true)
      .filter((plan) => {
        const structure = (structures[plan.y][plan.x] || [])[0];
        const site = (sites[plan.y][plan.x] || [])[0];
        return !structure && !site;
      }).sort((a, b) => BUILD_PRIORITY[b.type] - BUILD_PRIORITY[a.type]);
  }

  static getBasePos(room) {
    if (room.memory.basePos) {
      return room.memory.basePos;
    }

    const terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 49);

    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 1) {
      const spawnPos = spawns[0].pos;
      if (BaseLayout._canBaseFit(terrain, spawnPos.x - 5, spawnPos.y - 7)) {
        room.memory.basePos = {x: spawnPos.x - 5, y: spawnPos.y - 7};
        return room.memory.basePos;
      } else {
        room.memory.basePos = null;
        return room.memory.basePos;
      }
    }

    // TODO: Implement me -- auto find best base location for expansions
    return null;
  }

  static getBaseCenter(room) {
    const pos = BaseLayout.getBasePos(room);
    if (pos) {
      return room.getPositionAt(pos.x + (SIZE - 1) / 2, pos.y + (SIZE - 1) / 2);
    }
    return null;
  }

  static _canBaseFit(terrain, x, y) {
    // The base musn't be touching the edges of the map
    if (x <= 0 || y <= 0 || x + SIZE >= 50 || y + SIZE >= 50) {
      return false;
    }

    for (let ii = 0; ii < SIZE; ii++) {
      for (let jj = 0; jj < SIZE; jj++) {
        if (terrain[y + ii][x + jj][0] === 'wall') {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Used for debugging & testing, spits out what structures to build at each
   * level
   */
  static getBuildingsByLevel() {
    const levels = [{}, {}, {}, {}, {}, {}, {}, {}];

    for (const arr of BASE_LAYOUT) {
      for (const struct of arr) {
        if (struct) {
          const l = struct.l - 1;
          levels[l][struct.s] = (levels[l][struct.s] || 0) + 1;
        }
      }
    }

    return levels;
  }

  /**
   * Given an RCL and xy-coordinates, returns a list of plans for where
   * structures should be.
   */
  static getBasePlans(x, y, level, includePrevious) {
    const plans = [];
    for (let [iy, arr] of BASE_LAYOUT.entries()) {
      for (let [ix, struct] of arr.entries()) {
        if (!struct) {
          continue;
        }

        if ((includePrevious && struct.l <= level) ||
            (!includePrevious && struct.l === level)) {
          plans.push({x: x + ix, y: y + iy, type: struct.s});
        }
      }
    }

    return plans;
  }

  /**
   * Given a room, returns an array possibly containing 'NE', 'NW', 'SE', 'SW'
   * representing portions of the base are built and require a reloader
   */
  static getActiveQuadrants(room) {
    if (!room.controller || !room.controller.my) {
      return [];
    }

    switch (room.controller.level) {
    case 4:
      return ['SW'];
    case 5:
    case 6:
      return ['SW', 'SE'];
    case 7:
    case 8:
      return ['SW', 'SE', 'NE'];
    }

    return [];
  }

  /**
   * Given a room and quadrant, returns all the energy bearing structures in
   * that quadrant that require reloading.
   */
  static getQuadrantEnergyStructures(room, quadrant) {
    const pos = BaseLayout.getBasePos(room);
    if (!pos) {
      return [];
    }

    const qSize = Math.floor((SIZE - 1) / 2);
    const x = pos.x + ((quadrant == 'NE' || quadrant == 'SE') ? qSize : 0);
    const y = pos.y + ((quadrant == 'SW' || quadrant == 'SE') ? qSize : 0);

    const extraLooks = {
      NE: [{x: 5, y: 3}, {x: 9, y: 7}],
      NW: [{x: 7, y: 3}, {x: 3, y: 7}],
      SE: [{x: 5, y: 9}, {x: 9, y: 5}],
      SW: [{x: 7, y: 9}, {x: 3, y: 5}]
    };

    // Note: find() is faster than lookForAtArea() here
    const result = room.find(
      FIND_MY_STRUCTURES
    ).filter((structure) => {
      const pos = structure.pos;
      return structure.structureType !== STRUCTURE_LINK &&
        structure.energyCapacity > 0 &&
        x <= pos.x && pos.x <= x + qSize &&
        y <= pos.y && pos.y <= y + qSize
    });

    for (const extra of extraLooks[quadrant]) {
      const struct = room.lookForAt(
        LOOK_STRUCTURES, pos.x + extra.x, pos.y + extra.y
      )[0];
      struct && struct.energyCapacity > 0 && result.push(struct);
    }

    return result;
  }

  static drawBase(x, y, level, includePrevious, roomName) {
    // Test by using RoomVisual
    // First, get all the structures to place at that level
    const sites = BaseLayout.getBasePlans(x, y, level, includePrevious);

    const vis = new RoomVisual(roomName);
    // Draw the bounding box around the whole base
    vis.rect(
      x - 0.5,
      y - 0.5,
      SIZE,
      SIZE,
      {fill: null, stroke: '#ffffff'}
    );

    const roads = {};

    for (const site of sites) {
      switch (site.type) {
      case STRUCTURE_SPAWN:
        vis.circle(site.x, site.y, {radius: 0.5, fill: 'yellow'});
        break;
      case STRUCTURE_EXTENSION:
        vis.circle(site.x, site.y, {radius: 0.2, fill: 'yellow'});
        break;
      case STRUCTURE_TOWER:
        vis.text('T', site.x, site.y + 0.25);
        break;
      case STRUCTURE_STORAGE:
        vis.text('\uD83C\uDFE7', site.x, site.y + 0.3);
        break;
      case STRUCTURE_LINK:
        vis.text('L', site.x, site.y + 0.25);
        break;
      case STRUCTURE_LAB:
        vis.text('\u2697', site.x, site.y + 0.3);
        break;
      case STRUCTURE_TERMINAL:
        vis.text('\uD83D\uDCBB', site.x, site.y + 0.3);
        break;
      case STRUCTURE_NUKER:
        vis.text('\u2622', site.x, site.y + 0.3);
        break;
      case STRUCTURE_OBSERVER:
        vis.text('\uD83D\uDC40', site.x, site.y + 0.3);
        break;
      case STRUCTURE_POWER_SPAWN:
        vis.text('\u26A1\uFE0F', site.x, site.y + 0.3);
        break;
      case STRUCTURE_ROAD:
        for (let offsetX = site.x - 1; offsetX <= site.x + 1; offsetX++) {
          for (let offsetY = site.y - 1; offsetY <= site.y; offsetY++) {
            if (roads[offsetX + ',' + offsetY]) {
              vis.line(offsetX, offsetY, site.x, site.y, {lineStyle: 'dotted'});
            }
          }
        }
        roads[site.x + ',' + site.y] = true;
        break;
      }
    }
  }
}

Profiler.registerClass(BaseLayout, 'BaseLayout');

module.exports = BaseLayout;
