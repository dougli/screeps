const Task = require('Task');
const Paths = require('Paths');

const MAX_REUSE_PATH = 10;

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
  return a.x === b.x && a.y === b.y && a.r === b.r && a.d === b.d;
}

function calculatePath(creep, target) {
  const dest = {
    pos: new RoomPosition(target.x, target.y, target.r),
    range: target.d
  };
  const path = Paths.search(creep.pos, dest);
  creep.memory._path = {r: 0, t: target, p: Paths.serialize(path)};
}

function moveByPath(creep) {
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
  }

  mem.r = roomIndex;
  if (index < subpath[3].length) {
    return creep.move(subpath[3][index]);
  }
  return OK;
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
      if (result == ERR_NOT_FOUND) {
        calculatePath(this, target);
        result = moveByPath(this);
      }
      return result;
    }

    Creep.prototype.moveToWithTrail = function(target, opts) {
      if (!opts) {
        opts = {};
      }
      opts.reusePath = opts.reusePath || MAX_REUSE_PATH;
      this.moveTo(target, opts);
    };

    Creep.prototype.moveToExperimental = function(dest) {
      let target = null;
      if (dest instanceof Creep) {
        target = makeTarget(dest.pos.x, dest.pos.y, dest.pos.roomName, 1);
        target.id = dest.id;
      } else if (dest instanceof RoomObject) {
        const range = Paths.isWalkable(dest) ? 0 : 1;
        target = makeTarget(dest.pos.x, dest.pos.y, dest.pos.roomName, range);
      } else if (dest instanceof RoomPosition) {
        target = makeTarget(dest.x, dest.y, dest.roomName, 0);
      } else {
        return ERR_INVALID_TARGET;
      }

      if (!sameTarget(this, target)) {
        calculatePath(this, target);
      }

      let result = moveByPath(this);
      if (result == ERR_NOT_FOUND) {
        calculatePath(this, target);
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
