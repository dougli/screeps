
function s(structureType, roomLevel) {
  return {s: structureType, l: roomLevel};
}


const SIZE = 13;
const BASE_LAYOUT = [
/*  1 */  [null],
/*  2 */  [null],
/*  3 */  [],
/*  4 */  [],
/*  5 */  [],
/*  6 */  [],
/*  7 */  [null, s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_LINK, 5), s(STRUCTURE_ROAD, 3), s(STRUCTURE_STORAGE, 4)],
/*  8 */  [null, s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_TOWER, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 1), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 8), null, s(STRUCTURE_TOWER, 7)],
/*  9 */  [s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_TOWER, 5), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 7)],
  /* 10 */  [null, s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4)],
/* 11 */  [null, s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4)],
/* 12 */  [null, null, s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4)],
/* 13 */  [null, null, null, null, s(STRUCTURE_EXTENSION, 4)]
];

class BaseLayout {
  static getStructureAt(x, y) {
    const arr = BASE_LAYOUT[x];
    return (arr && arr[y] && arr[y].s) || null;
  }

  static getUnbuiltStructures(room) {
    if (!room || !room.controller) {
      return null;
    }
  }

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
   * Given a room level, returns all the structures to that level should build
   * and all the offsets from the top left in x, y coordinates.
   */
  static getStructuresForLevel(level, includePrevious) {
    const result = [];
    for (let [y, arr] of BASE_LAYOUT.entries()) {
      for (let [x, struct] of arr.entries()) {
        if (!struct) {
          continue;
        }

        if ((includePrevious && struct.l <= level) ||
            (!includePrevious && struct.l === level)) {
          result.push({x, y, type: struct.s});
        }
      }
    }

    return result;
  }

  static getConstructionSites(centerX, centerY, level, includePrevious) {
    const sites = BaseLayout.getStructuresForLevel(level, includePrevious);
    const offset = Math.floor((SIZE - 1) / 2);
    for (const site of sites) {
      site.x += centerX - offset;
      site.y += centerY - offset;
    }
    return sites;
  }

  static drawBase(centerX, centerY, level, includePrevious, roomName) {
    // Test by using RoomVisual
    // First, get all the structures to place at that level
    const sites = BaseLayout.getConstructionSites(
      centerX, centerY, level, includePrevious);
    const offset = Math.floor((SIZE - 1) / 2);

    const vis = new RoomVisual(roomName);
    // Draw the bounding box around the whole base
    vis.rect(
      centerX - offset - 0.5,
      centerY - offset - 0.5,
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
        vis.text('S', site.x, site.y + 0.25);
        break;
      case STRUCTURE_ROAD:
        for (let offsetX = site.x - 1; offsetX <= site.x + 1; offsetX++) {
          for (let offsetY = site.y - 1; offsetY <= site.y; offsetY++) {
            if (roads[offsetX + ',' + offsetY]) {
              vis.line(offsetX, offsetY, site.x, site.y);
            }
          }
        }
        roads[site.x + ',' + site.y] = true;
        break;
      }
    }
  }
}

module.exports = BaseLayout;
