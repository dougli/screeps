const Mission = require('Mission');
const Rooms = require('Rooms');

const SUCCESS_TIME = 100;

const BOOSTS = {
  // Heal
  [RESOURCE_LEMERGIUM_OXIDE]: 2,
  [RESOURCE_LEMERGIUM_ALKALIDE]: 3,
  [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: 4,
  // Attack
  [RESOURCE_UTRIUM_HYDRIDE]: 2,
  [RESOURCE_UTRIUM_ACID]: 3,
  [RESOURCE_CATALYZED_UTRIUM_ACID]: 4,
  // Ranged attack
  [RESOURCE_KEANIUM_OXIDE]: 2,
  [RESOURCE_KEANIUM_ALKALIDE]: 3,
  [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: 4
}

class DefenseMission extends Mission {
  static create(roomName) {
    return new DefenseMission(
      null,
      {type: 'defense', room: roomName, lastHostileTime: Game.time}
    );
  }

  static deserialize(id, memory) {
    return new DefenseMission(id, memory);
  }

  constructor(id, memory) {
    super(id, memory);
    if (Game.rooms[this.memory.room]) {
      Game.rooms[this.memory.room].defenseMission = this;
    }
  }

  get name() {
    return 'Defend ' + this.memory.room;
  }

  run() {
    const room = Game.rooms[this.memory.room];
    if (!room) {
      this.concludeFailedMission();
      return;
    }

    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length) {
      this.memory.lastHostileTime = Game.time;
    }
    if (this.memory.lastHostileTime + SUCCESS_TIME < Game.time) {
      this.concludeSuccessfulMission();
      return;
    }
    // 1. Analyze the enemy's healpower

    // 2. Amass firepower if necessary

    // 3. Attack if we see a chance of victory
    const healPower = {};
    for (const hostile of hostiles) {
      const maxHeal = hostiles.reduce((accum, other) => {
        return accum + this._getHealCreepFor(hostile, other);
      }, 0);

      const towers = Rooms.getFriendlyTowers(room);
      const maxDamage = towers.reduce((accum, tower) => {
        return accum + tower.getDamageFor(hostile);
      }, 0);

      // Attack if our damage overpowers a creep's total heal
      if (maxDamage > maxHeal) {
        towers.forEach(tower => tower.attack(hostile));
        return;
      }
    }
  }

  _getHealCreepFor(main, other) {
    let power = 0;
    const range = main.pos.getRangeTo(other);

    if (range > 3) {
      return 0;
    } else if (range > 1) {
      power = RANGED_HEAL_POWER;
    } else {
      power = HEAL_POWER;
    }

    return other.body.reduce((accum, part) => {
      return (part.hits <= 0 || part.type !== HEAL)
        ? accum
        : accum + power * (BOOSTS[part.boost] || 1);
    }, 0);
  }
}

module.exports = DefenseMission;
