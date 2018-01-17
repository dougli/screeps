const Task = require('Task');
const Paths = require('Paths');

const MAX_REUSE_PATH = 10;
const BLOCKED = 'BLOCKED';

const MOVE_DELTA = {
  [TOP]: {x: 0, y: -1},
  [TOP_RIGHT]: {x: 1, y: -1},
  [RIGHT]: {x: 1, y: 0},
  [BOTTOM_RIGHT]: {x: 1, y: 1},
  [BOTTOM]: {x: 0, y: 1},
  [BOTTOM_LEFT]: {x: -1, y: 1},
  [LEFT]: {x: -1, y: 0},
  [TOP_LEFT]: {x: -1, y: -1},
}

function makeTarget(x, y, name, range) {
  return {x, y, r: name, d: range};
}

function sameTarget(creep, b) {
  const a = creep.memory._path && creep.memory._path.t;
  if (!a) {
    return false;
  }
  // If the target is a creep and we're not in the same room, never repath
  if (b.id && a.id === b.id && a.r === b.r && creep.room.name !== a.r) {
    return true;
  }

  return a.x === b.x && a.y === b.y && a.r === b.r && a.d === b.d;
}

function calculatePath(creep, target, freshMatrix) {
  const dest = {
    pos: new RoomPosition(target.x, target.y, target.r),
    range: target.d
  };
  const opts = {freshMatrix: !!freshMatrix};
  const path = Paths.search(creep.pos, dest, opts);
  creep.memory._path = {r: 0, t: target, p: Paths.serialize(path)};
}

function moveByPath(creep) {
  if (creep.fatigue > 0) {
    return ERR_TIRED;
  }
  const mem = creep.memory._path;
  let path = mem.p;
  let roomIndex = mem.r;

  // If the creep has advanced into another room
  if (path.length > roomIndex + 1 &&
      creep.room.name === path[roomIndex + 1][0]) {
    roomIndex++;
  } else if (creep.room.name !== path[roomIndex][0]) {
    return ERR_NOT_FOUND;
  }
  const subpath = path[roomIndex];

  // Update pathIndex to reflect the latest status
  let pos = {x: subpath[1], y: subpath[2]};
  let index = 0;
  let found = false;
  do {
    if (creep.pos.x === pos.x && creep.pos.y === pos.y) {
      found = true;
      break;
    }

    const dir = MOVE_DELTA[subpath[3][index]];
    pos.x += dir.x;
    pos.y += dir.y;
    index++;
  } while (index < subpath[3].length);

  if (!found) {
    return ERR_NOT_FOUND;
  } else if (mem.r === roomIndex && mem.i === index) {
    // We were supposed to move last turn but failed likely due to blockage. Repath
    return BLOCKED;
  }
  delete mem.i;

  mem.r = roomIndex;
  if (index >= subpath[3].length) {
    if (roomIndex === path.length -1) {
      delete creep.memory._path;
      return ERR_NOT_FOUND;
    }
    return OK;
  }

  const result = creep.move(subpath[3][index]);
  if (result === OK) {
    mem.i = index;
  }
  return result;
}

module.exports = {
  run: function() {
    Creep.prototype.moveToRoom = function(roomOrName) {
      const name = roomOrName instanceof Room ? roomOrName.name : roomOrName;
      if (this.pos.roomName === name &&
          this.pos.x > 0 && this.pos.x < 49 &&
          this.pos.y > 0 && this.pos.y < 49) {
        return OK;
      }

      // Try to find a path in memory
      const target = makeTarget(25, 25, name, 23);
      if (!sameTarget(this, target)) {
        calculatePath(this, target);
      }

      let result = moveByPath(this);
      if (result === BLOCKED) {
        calculatePath(this, target, true);
        result = moveByPath(this);
      }
      return result;
    }

    Creep.prototype.moveToExperimental = function(dest) {
      const destPos = dest && (dest instanceof RoomPosition ? dest : dest.pos);
      if (this.pos.isNearTo(destPos)) {
        return this.move(this.pos.getDirectionTo(destPos));
      }

      let target = null;
      if (dest instanceof Creep) {
        target = makeTarget(dest.pos.x, dest.pos.y, dest.pos.roomName, 1);
        target.id = dest.id;
      } else if (dest instanceof StructureContainer) {
        // Force container range to be 1 since we can pickup from afar
        target = makeTarget(dest.pos.x, dest.pos.y, dest.pos.roomName, 1);
      } else if (dest instanceof RoomObject) {
        const range = Paths.isWalkable(dest) ? 0 : 1;
        target = makeTarget(dest.pos.x, dest.pos.y, dest.pos.roomName, range);
      } else if (dest instanceof RoomPosition) {
        const range = Game.map.getTerrainAt(dest) === 'wall' ? 1 : 0;
        target = makeTarget(dest.x, dest.y, dest.roomName, range);
      } else {
        return ERR_INVALID_TARGET;
      }

      if (!sameTarget(this, target)) {
        calculatePath(this, target);
      }

      let result = moveByPath(this);
      if (result === BLOCKED) {
        calculatePath(this, target, true);
        result = moveByPath(this);
      }

      return result;
    }

    Creep.prototype.save = function() {
      this.memory.tasks = this.tasks.map(
        (task) => task.serializeForCreep()
      );
    };

    Object.defineProperty(Creep.prototype, 'tasks', {
      get: function() {
        if (!this._tasksLoaded) {
          var memory = this.memory.tasks || [];
          this._tasks = (this.memory.tasks || [])
            .map(Task.deserializeForCreep)
            .filter((t) => t);
          this._tasksLoaded = true;
        }
        return this._tasks;
      },

      set: function(tasks) {
        this._tasks = tasks;
      },
    });
  }
};
