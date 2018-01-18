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
  creep.memory._path = {
    index: -1,
    stuck: 0,
    target: target,
    path: Paths.serialize(path),
    lastPos: null
  };
}

function isSamePos(mem, creepPos) {
  if (!mem) {
    return false;
  }
  return mem.x === creepPos.x &&
    mem.y === creepPos.y &&
    mem.room === creepPos.roomName;
}

function getBoundaryPos(pos) {
  if (!pos) {
    return null;
  } else if (pos.x == 0) {
    return {x: 49, y: pos.y, room: Game.map.describeExits(pos.room)[LEFT]};
  } else if (pos.x == 49) {
    return {x: 0, y: pos.y, room: Game.map.describeExits(pos.room)[RIGHT]};
  } else if (pos.y == 0) {
    return {x: pos.x, y: 49, room: Game.map.describeExits(pos.room)[TOP]};
  } else if (pos.y == 49) {
    return {x: pos.x, y: 0, room: Game.map.describeExits(pos.room)[BOTTOM]};
  }
  return null;
}

function moveByPath(creep) {
  if (creep.fatigue > 0) {
    return ERR_TIRED;
  }
  const mem = creep.memory._path;

  // Migration code
  if (!('index' in mem)) {
    delete creep.memory._path;
    return BLOCKED;
  }

  let lastPos = mem.lastPos;

  let pos = creep.pos;
  if (isSamePos(lastPos, pos) || isSamePos(getBoundaryPos(lastPos), pos)) {
    mem.stuck++;
    return BLOCKED;
  } else {
    mem.stuck = 0;
    mem.lastPos = {x: pos.x, y: pos.y, room: pos.roomName};
    mem.index++;
  }

  if (mem.index >= mem.path.length) {
    delete creep.memory._path;
    return;
  }

  return creep.move(mem.path[mem.index]);
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
      if (!destPos) {
        return ERR_INVALID_TARGET;
      }

      if (this.pos.isNearTo(destPos)) {
        return this.move(this.pos.getDirectionTo(destPos));
      }

      let target = makeTarget(destPos.x, destPos.y, destPos.roomName, 1);
      if (dest instanceof Creep) {
        target.id = dest.id;
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
