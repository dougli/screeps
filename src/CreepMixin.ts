import { Paths } from 'Paths';
import * as Profiler from 'Profiler';
import { Task } from 'Task';

const MAX_REUSE_PATH = 10;
type BLOCKED = 'BLOCKED';
const BLOCKED = 'BLOCKED';

const STUCK_RESET = 2;

const MOVE_DELTA = {
  [TOP]: {x: 0, y: -1},
  [TOP_RIGHT]: {x: 1, y: -1},
  [RIGHT]: {x: 1, y: 0},
  [BOTTOM_RIGHT]: {x: 1, y: 1},
  [BOTTOM]: {x: 0, y: 1},
  [BOTTOM_LEFT]: {x: -1, y: 1},
  [LEFT]: {x: -1, y: 0},
  [TOP_LEFT]: {x: -1, y: -1},
};

interface MemPos {
  x: number;
  y: number;
  room: string;
}

interface MoveTarget {
  x: number;
  y: number;
  r: string;
  d: number;
  id?: string;
}

interface MemorizedPath {
  index: number;
  lastPos: MemPos;
  path: string;
  stuck: number;
  target: MoveTarget;
}

function makeTarget(x: number, y: number, room: string, range: number): MoveTarget {
  return {x, y, r: room, d: range};
}

function sameTarget(creep: Creep, b: MoveTarget): boolean {
  const a = creep.memory._path && creep.memory._path.target;
  if (!a) {
    return false;
  }
  // If the target is a creep and we're not in the same room, never repath
  if (b.id && a.id === b.id && a.r === b.r && creep.room.name !== a.r) {
    return true;
  }

  return a.x === b.x && a.y === b.y && a.r === b.r && a.d === b.d;
}

function calculatePath(
  creep: Creep,
  target: MoveTarget,
  freshMatrix: boolean = false,
): MemorizedPath {
  const dest = {
    pos: new RoomPosition(target.x, target.y, target.r),
    range: target.d,
  };

  const opts: {[key: string]: any} = {freshMatrix: !!freshMatrix};
  const moveParts = creep.getActiveBodyparts(MOVE);
  if (moveParts === creep.body.length) {
    opts.ignoreTerrain = true;
  } else if (moveParts * 2 >= creep.body.length) {
    opts.ignoreRoads = true;
  }

  const path = Paths.search(creep.pos, dest, opts).path;
  return {
    index: 0,
    lastPos: {x: creep.pos.x, y: creep.pos.y, room: creep.pos.roomName},
    path: Paths.serialize(path),
    stuck: 0,
    target,
  };
}

function isSamePos(
  mem: MemPos | null,
  creepPos: RoomPosition,
): boolean {
  if (!mem) {
    return false;
  }
  return mem.x === creepPos.x &&
    mem.y === creepPos.y &&
    mem.room === creepPos.roomName;
}

function getBoundaryPos(pos: MemPos | null): MemPos | null {
  if (!pos) {
    return null;
  } else if (pos.x === 0) {
    return {x: 49, y: pos.y, room: '' + Game.map.describeExits(pos.room)[LEFT]};
  } else if (pos.x === 49) {
    return {x: 0, y: pos.y, room: '' + Game.map.describeExits(pos.room)[RIGHT]};
  } else if (pos.y === 0) {
    return {x: pos.x, y: 49, room: '' + Game.map.describeExits(pos.room)[TOP]};
  } else if (pos.y === 49) {
    return {x: pos.x, y: 0, room: '' + Game.map.describeExits(pos.room)[BOTTOM]};
  }
  return null;
}

function moveToTarget(creep: Creep, target: MoveTarget): CreepMoveReturnCode {
  if (creep.fatigue > 0) {
    return ERR_TIRED;
  }

  const mem = creep.memory;
  const lastPos = mem._path && mem._path.lastPos;
  const pos = creep.pos;
  let recalculate = false;

  if (!mem._path || !sameTarget(creep, target)) {
    // If new target
    recalculate = true;
  } else if (isSamePos(lastPos, pos) ||
             isSamePos(getBoundaryPos(lastPos), pos)) {
    // Otherwise if we're stuck
    recalculate = (++mem._path.stuck >= STUCK_RESET);
  } else {
    // Otherwise, increment our move counters and check we are
    mem._path.stuck = 0;
    mem._path.lastPos = {x: pos.x, y: pos.y, room: pos.roomName};
    recalculate = (++mem._path.index >= mem._path.path.length);
  }

  if (!mem._path || recalculate) {
    mem._path = calculatePath(creep, target);
  }

  const dir = parseInt(mem._path.path[mem._path.index], 10) as DirectionConstant;
  return creep.move(dir);
}

declare global {
  interface Creep {
    moveToRoom: (roomOrName: Room | string) => CreepMoveReturnCode;
    moveToExperimental: (
      target: RoomObject | RoomPosition,
    ) => CreepMoveReturnCode | ERR_INVALID_TARGET;
    save: () => void;
    tasks: Task[];
  }

  interface CreepMemory {
    _path: MemorizedPath | null;
  }
}

export function run(): void {
  Creep.prototype.moveToRoom = function(roomOrName: Room | string): CreepMoveReturnCode {
    const name = roomOrName instanceof Room ? roomOrName.name : roomOrName;
    if (this.pos.roomName === name &&
        this.pos.x > 0 && this.pos.x < 49 &&
        this.pos.y > 0 && this.pos.y < 49) {
      return OK;
    }

    // Try to find a path in memory
    const target = makeTarget(25, 25, name, 23);
    return moveToTarget(this, target);
  };

  Creep.prototype.moveToExperimental = function(
    dest: RoomObject | RoomPosition,
  ): CreepMoveReturnCode | ERR_INVALID_TARGET {
    const destPos = dest && (dest instanceof RoomPosition ? dest : dest.pos);
    if (!destPos) {
      return ERR_INVALID_TARGET;
    }

    const range = this.pos.getRangeTo(destPos);
    if (range === 1) {
      return this.move(this.pos.getDirectionTo(destPos));
    } else if (range === 0) {
      return OK;
    }

    const target = makeTarget(destPos.x, destPos.y, destPos.roomName, 1);
    if (dest instanceof Creep) {
      target.id = dest.id;
    }

    return moveToTarget(this, target);
  };

  Creep.prototype.save = function(): void {
    this.memory.tasks = this.tasks.map((task) => task.serializeForCreep());
  };

  Object.defineProperty(Creep.prototype, 'tasks', {
    get(): Task[] {
      if (!this._tasksLoaded) {
        const memory = this.memory.tasks || [];
        this._tasks = (this.memory.tasks || [])
          .map(Task.deserializeForCreep)
          .filter((t) => t);
        this._tasksLoaded = true;
      }
      return this._tasks;
    },

    set(tasks: Task[]): void {
      this._tasks = tasks;
    },
  });
}
