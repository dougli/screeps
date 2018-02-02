const Mission = require('Mission');

const EXPLORE_PING = 5000;
const HOSTILE_PING = 5000;
const SCOUT_RANGE = 3;

class ScoutMission extends Mission {
  static shouldScout(fromBase) {
    return !!ScoutMission.findScoutTarget(fromBase, fromBase);
  }

  static create(base) {
    return new ScoutMission(null, {type: 'scout', base});
  }

  static deserialize(id, memory) {
    return new ScoutMission(id, memory);
  }

  constructor(id, memory) {
    super(id, memory);
    if (Game.rooms[this.memory.base]) {
      Game.rooms[this.memory.base].scoutMission = this;
    }
  }

  get name() {
    return 'Scouting from ' + this.memory.base;
  }

  run() {
    const scout = this.requisitionCreep('scout', 'scout');
    if (!scout || scout.hasTask()) {
      return;
    }

    const newTarget = ScoutMission.findScoutTarget(
      this.memory.base,
      scout.getRoomName());
    if (!newTarget) {
      this.concludeSuccessfulMission();
      return;
    }

    scout.setTarget(newTarget);
  }

  static findScoutTarget(base, fromRoom) {
    // Find a target for the scout
    const targets = ScoutMission.getRoomsInRange(base, SCOUT_RANGE);
    const possibleTargets = Object.assign({}, targets);
    for (const room in possibleTargets) {
      const memory = Memory.rooms[room];
      if (!memory) {
        continue;
      }
      if ((memory.hostile && memory.lastSeen + HOSTILE_PING >= Game.time) ||
          (!memory.hostile && memory.lastSeen + EXPLORE_PING >= Game.time)) {
        delete possibleTargets[room];
      }
    }

    // We've scouted everything!
    if (!Object.keys(possibleTargets)) {
      return null;
    }

    // Otherwise, pick a target near the scout
    let closest = null;
    let minDistance = Number.POSITIVE_INFINITY;
    for (const target in possibleTargets) {
      const distance = Game.map.findRoute(fromRoom, target, (room, from) => {
        if (!(room in targets)) {
          return Number.POSITIVE_INFINITY;
        } else if (Memory.rooms[room] && Memory.rooms[room].hostile) {
          return (Memory.rooms[room].lastSeen + HOSTILE_PING < Game.time)
            ? 1
            : Number.POSITIVE_INFINITY;
        }
        return 1;
      }).length;
      if (distance !== ERR_NO_PATH && distance < minDistance) {
        closest = target;
        minDistance = distance;
      }
    }

    return closest;
  }

  static getRoomsInRange(origin, range) {
    const result = {};
    let queue = [origin];

    for (let ii = 0; ii <= range; ii++) {
      let nextQueue = [];

      queue.forEach(room => {
        // Don't walk in impassable or hostile rooms
        if (!Game.map.isRoomAvailable(room)) {
          return;
        }
        const memory = Memory.rooms[room];
        if (memory && memory.hostile &&
            memory.lastSeen + HOSTILE_PING >= Game.time) {
          return;
        }


        result[room] = ii;

        const exits = Game.map.describeExits(room);
        for (const dir in exits) {
          const neighbor = exits[dir];
          if (!(neighbor in result)) {
            nextQueue.push(neighbor);
          }
        }
      });

      queue = nextQueue;
    }
    return result;
  }
}

exports.ScoutMission = ScoutMission;
