let REQUESTED_CREEPS = [];
let LastTick = 0;

class Mission {
  static getCreepRequisitions() {
    if (Game.time != LastTick) {
      REQUESTED_CREEPS = [];
      LastTick = Game.time;
    }
    return REQUESTED_CREEPS;
  }

  constructor(id, memory) {
    this.id = id || Math.random().toString(16).substr(2);
    this.memory = memory || {};
    this.creeps = {};
    Game.missions[this.id] = this;
  }

  get memory() {
    if (!Memory.missions) {
      Memory.missions = {};
    }
    if (!Memory.missions[this.id]) {
      Memory.missions[this.id] = {};
    }
    return Memory.missions[this.id];
  }

  set memory(value) {
    if (!Memory.missions) {
      Memory.missions = {};
    }
    Memory.missions[this.id] = value;
  }

  get name() {
    return 'Mission ' + this.id;
  }

  concludeSuccessfulMission() {
    const message = 'Mission: ' + this.name + ' was successful!';
    Game.notify(message, 1440);
    console.log(message);
    delete Memory.missions[this.id];
    delete Game.missions[this.id];
  }

  concludeFailedMission() {
    const message = 'Mission: ' + this.name + ' failed.';
    Game.notify(message);
    console.log(message);
    delete Memory.missions[this.id];
    delete Game.missions[this.id];
  }

  requisitionCreep(key, type, memory, replenish) {
    const creep = this.creeps[key];

    if (Game.time != LastTick) {
      REQUESTED_CREEPS = [];
      LastTick = Game.time;
    }

    if (!creep ||
        (replenish && creep.isDyingSoon() && !creep.getReplenishedBy())) {
      if (replenish && creep) {
        memory.replenish = creep.creep.id;
      }

      REQUESTED_CREEPS.push({mission: this, key, type, memory});
    }

    return creep;
  }

  provideCreep(key, creep) {
    this.creeps[key] = creep;
  }
}

module.exports = Mission;
