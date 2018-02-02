import { Mission } from 'Mission';
import { Scout } from 'role.Scout';

const EXPLORE_PING = 5000;
const HOSTILE_PING = 5000;
const SCOUT_RANGE = 3;

declare global {
  interface Room {
    scoutMission: ScoutMission | undefined;
  }
}

export class ScoutMission extends Mission {
  public static shouldScout(fromBase: string): boolean {
    return !!ScoutMission.findScoutTarget(fromBase, fromBase);
  }

  public static create(base: string): ScoutMission {
    return new ScoutMission(null, {type: 'scout', base});
  }

  constructor(id: string | null, memory: object) {
    super(id, memory);
    if (Game.rooms[this.memory.base]) {
      Game.rooms[this.memory.base].scoutMission = this;
    }
  }

  public get name(): string {
    return 'Scouting from ' + this.memory.base;
  }

  public run(): void {
    const scout = this.requisitionCreep<Scout>('scout', 'scout');
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

  private static findScoutTarget(base: string, fromRoom: string): string | null {
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
    let closest: string | null = null;
    let minDistance = Number.POSITIVE_INFINITY;
    for (const target in possibleTargets) {
      const distance = Game.map.findRoute(fromRoom, target, {
        routeCallback: (room, from) => {
          if (!(room in targets)) {
            return Number.POSITIVE_INFINITY;
          } else if (Memory.rooms[room] && Memory.rooms[room].hostile) {
            return (Memory.rooms[room].lastSeen + HOSTILE_PING < Game.time)
              ? 1
              : Number.POSITIVE_INFINITY;
          }
          return 1;
        },
      });

      if (distance !== ERR_NO_PATH && distance.length < minDistance) {
        closest = target;
        minDistance = distance.length;
      }
    }

    return closest;
  }

  private static getRoomsInRange(
    origin: string,
    range: number,
  ): {[roomName: string]: number} {
    const result = {};
    let queue = [origin];

    for (let ii = 0; ii <= range; ii++) {
      const nextQueue: string[] = [];

      queue.forEach((room) => {
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
