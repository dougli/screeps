import * as Profiler from 'Profiler';

interface BuildPlan {
  x: number;
  y: number;
  type: BuildableStructureConstant;
}

const BUILD_PRIORITY = {
  [STRUCTURE_TOWER]: 15,
  [STRUCTURE_SPAWN]: 14,
  [STRUCTURE_EXTENSION]: 13,
  [STRUCTURE_STORAGE]: 12,
  [STRUCTURE_LINK]: 11,
  [STRUCTURE_OBSERVER]: 10,
  [STRUCTURE_LAB]: 9,
  [STRUCTURE_TERMINAL]: 8,
  [STRUCTURE_NUKER]: 7,
  [STRUCTURE_ROAD]: 4,
  [STRUCTURE_POWER_SPAWN]: 3,
};

function s(
  structureType: BuildableStructureConstant,
  roomLevel: number,
): {s: BuildableStructureConstant, l: number} {
  return {s: structureType, l: roomLevel};
}

const SIZE = 13;

/* tslint:disable */
const BASE_LAYOUT = [
/*  1 */  [null, s(STRUCTURE_ROAD, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 6), s(STRUCTURE_ROAD, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_ROAD, 7)],
/*  2 */  [s(STRUCTURE_ROAD, 6), s(STRUCTURE_OBSERVER, 8), s(STRUCTURE_LAB, 8), s(STRUCTURE_LAB, 8), s(STRUCTURE_ROAD, 6), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), null, s(STRUCTURE_ROAD, 7)],
/*  3 */  [s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 8), s(STRUCTURE_LAB, 7), s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 7), s(STRUCTURE_ROAD, 6), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 7)],
/*  4 */  [s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 8), s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 6), s(STRUCTURE_LAB, 6), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 8), s(STRUCTURE_ROAD, 7)],
/*  5 */  [s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_LAB, 7), s(STRUCTURE_LAB, 6), s(STRUCTURE_TERMINAL, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_POWER_SPAWN, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 7)],
/*  6 */  [s(STRUCTURE_ROAD, 6), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 6), s(STRUCTURE_TOWER, 8), s(STRUCTURE_ROAD, 5), null, s(STRUCTURE_ROAD, 4), s(STRUCTURE_NUKER, 8), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 7), s(STRUCTURE_EXTENSION, 7), s(STRUCTURE_ROAD, 7)],
/*  7 */  [s(STRUCTURE_ROAD, 8), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_LINK, 5), s(STRUCTURE_ROAD, 3), s(STRUCTURE_STORAGE, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_TOWER, 8), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 8)],
/*  8 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_TOWER, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 1), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 8), s(STRUCTURE_ROAD, 5), s(STRUCTURE_TOWER, 7), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 5)],
/*  9 */  [s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_TOWER, 5), s(STRUCTURE_ROAD, 3), s(STRUCTURE_SPAWN, 7), s(STRUCTURE_ROAD, 5), s(STRUCTURE_TOWER, 8), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 6)],
/* 10 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_EXTENSION, 2), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5)],
/* 11 */  [s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 3), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 6), s(STRUCTURE_ROAD, 5)],
/* 12 */  [s(STRUCTURE_ROAD, 4), null, s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 3), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_EXTENSION, 6), null, s(STRUCTURE_ROAD, 5)],
/* 13 */  [null, s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_EXTENSION, 4), s(STRUCTURE_ROAD, 4), s(STRUCTURE_ROAD, 8), s(STRUCTURE_ROAD, 5), s(STRUCTURE_EXTENSION, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_ROAD, 5), s(STRUCTURE_ROAD, 5)],
];
/* tslint:enable */

class BaseLayout {
  public static getPriorityMap(): {[key in BuildableStructureConstant]?: number} {
    return BUILD_PRIORITY;
  }

  public static getConstructionPlans(room: Room): BuildPlan[] {
    if (!room || !room.controller || !room.controller.my) {
      return [];
    }

    const level = room.controller.level;
    const pos = BaseLayout.getBasePos(room);
    if (!pos) {
      return [];
    }

    const structures = room.lookForAtArea(
      LOOK_STRUCTURES, pos.y, pos.x, pos.y + SIZE - 1, pos.x + SIZE - 1,
    );
    const sites = room.lookForAtArea(
      LOOK_CONSTRUCTION_SITES, pos.y, pos.x, pos.y + SIZE - 1, pos.x + SIZE - 1,
    );

    return BaseLayout.getBasePlans(pos.x, pos.y, level, true)
      .filter((plan) => {
        const structure = (structures[plan.y][plan.x] || [])[0];
        const site = (sites[plan.y][plan.x] || [])[0];
        return !structure && !site;
      }).sort((a, b) => BUILD_PRIORITY[b.type] - BUILD_PRIORITY[a.type]);
  }

  public static getBaseLink(room: Room): StructureLink | null {
    const base = BaseLayout.getBasePos(room);
    if (!base) {
      return null;
    }

    const linkPos = new RoomPosition(base.x + 4, base.y + 6, room.name);
    for (const st of linkPos.lookFor(LOOK_STRUCTURES)) {
      if (st.structureType === STRUCTURE_LINK && (st as StructureLink).my) {
        return st as StructureLink;
      }
    }
    return null;
  }

  public static getBasePos(room: Room): RoomPosition | null {
    let mem = room.memory.basePos;
    if (mem) {
      return new RoomPosition(mem.x, mem.y, room.name);
    }

    const terrain = room.lookForAtArea(LOOK_TERRAIN, 0, 0, 49, 49);

    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns.length === 1) {
      const spawnPos = spawns[0].pos;
      if (BaseLayout._canBaseFit(terrain, spawnPos.x - 5, spawnPos.y - 7)) {
        mem = room.memory.basePos = {x: spawnPos.x - 5, y: spawnPos.y - 7};
        return new RoomPosition(mem.x, mem.y, room.name);
      } else {
        room.memory.basePos = null;
        return null;
      }
    }

    // TODO: Implement me -- auto find best base location for expansions
    return null;
  }

  public static getBaseCenter(room: Room): RoomPosition | null {
    const pos = BaseLayout.getBasePos(room);
    if (pos) {
      return room.getPositionAt(pos.x + (SIZE - 1) / 2, pos.y + (SIZE - 1) / 2);
    }
    return null;
  }

  private static _canBaseFit(
    terrain: LookForAtAreaResultMatrix<Terrain, 'terrain'>,
    x: number,
    y: number,
  ): boolean {
    // The base musn't be touching the edges of the map
    if (x <= 0 || y <= 0 || x + SIZE >= 50 || y + SIZE >= 50) {
      return false;
    }

    for (let ii = 0; ii < SIZE; ii++) {
      for (let jj = 0; jj < SIZE; jj++) {
        if (terrain[y + ii][x + jj][0] as any === 'wall') {
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
  public static getBuildingsByLevel(
  ): Array<{[type in BuildableStructureConstant]?: number}> {
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
  public static getBasePlans(
    x: number,
    y: number,
    level: number,
    includePrevious: boolean,
  ): BuildPlan[] {
    const plans: BuildPlan[] = [];
    for (const [iy, arr] of BASE_LAYOUT.entries()) {
      for (const [ix, struct] of arr.entries()) {
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
  public static getActiveQuadrants(room: Room): string[] {
    if (!room.controller || !room.controller.my) {
      return [];
    }

    switch (room.controller.level) {
    case 4:
      return ['SW'];
    case 5:
      return ['SW'];
    case 6:
      return ['SW', 'NW'];
    case 7:
    case 8:
      return ['SW', 'NW'];
    }

    return [];
  }

  public static getBenchPosition(
    room: Room,
    quadrant: string,
  ): RoomPosition | null {
    const center = BaseLayout.getBaseCenter(room);
    if (!center) {
      return null;
    }
    switch (quadrant) {
    case 'NE':
      return new RoomPosition(center.x + 1, center.y, center.roomName);
    case 'NW':
      return new RoomPosition(center.x, center.y - 1, center.roomName);
    case 'SW':
      return new RoomPosition(center.x - 1, center.y, center.roomName);
    case 'SE':
      return new RoomPosition(center.x, center.y + 1, center.roomName);
    }
    return null;
  }

  /**
   * Given a room and quadrant, returns all the energy bearing structures in
   * that quadrant that require reloading.
   */
  public static getQuadrantEnergyStructures(
    room: Room,
    quadrant: string,
  ): Array<Structure<StructureConstant>> {
    const pos = BaseLayout.getBasePos(room);
    if (!pos) {
      return [];
    }

    const qSize = Math.floor((SIZE - 1) / 2);
    const x = pos.x + ((quadrant === 'NE' || quadrant === 'SE') ? qSize : 0);
    const y = pos.y + ((quadrant === 'SW' || quadrant === 'SE') ? qSize : 0);

    const extraLooks = {
      NE: [{x: 5, y: 3}, {x: 9, y: 7}],
      NW: [/*{x: 7, y: 3},*/ {x: 3, y: 7}, {x: 9, y: 7}],
      SE: [{x: 5, y: 9}, {x: 9, y: 5}],
      SW: [/*{x: 7, y: 9},*/ {x: 3, y: 5}, {x: 9, y: 5}],
    };

    // Note: find() is faster than lookForAtArea() here
    const result = room.find(FIND_MY_STRUCTURES).filter((structure) => {
      const sPos = structure.pos;
      switch (structure.structureType) {
      case STRUCTURE_EXTENSION:
      case STRUCTURE_SPAWN:
      case STRUCTURE_TOWER:
      case STRUCTURE_LAB:
      case STRUCTURE_TERMINAL:
      case STRUCTURE_LINK:
        break;
      default:
        return false;
      }

      return x <= sPos.x && sPos.x <= x + SIZE &&
        y <= sPos.y && sPos.y <= y + qSize;
    });

    for (const extra of extraLooks[quadrant]) {
      const struct: any = room.lookForAt(
        LOOK_STRUCTURES, pos.x + extra.x, pos.y + extra.y,
      )[0];
      if (struct && struct.energyCapacity > 0) {
        result.push(struct);
      }
    }

    return result;
  }

  public static drawBase(
    x: number,
    y: number,
    level: number,
    includePrevious: boolean,
    roomName: string,
  ): void {
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
      {fill: undefined, stroke: '#ffffff'},
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

export { BaseLayout };
export default BaseLayout;
