let REQUESTED_CREEPS: MissionRequisition[] = [];
let LastTick = 0;

interface MissionRequisition {
  mission: Mission;
  key: string;
  type: string;
  memory: {};
}

class Mission {
  private id: string;
  private creeps: {
    [key: string]: BaseUnit;
  };

  public static getCreepRequisitions(): MissionRequisition[] {
    if (Game.time !== LastTick) {
      REQUESTED_CREEPS = [];
      LastTick = Game.time;
    }
    return REQUESTED_CREEPS;
  }

  constructor(id: string | null, memory: {}) {
    this.id = id || Math.random().toString(16).substr(2);
    this.memory = memory || {};
    this.creeps = {};
    Game.missions[this.id] = this;
  }

  get memory(): {} {
    if (!Memory.missions) {
      Memory.missions = {};
    }
    if (!Memory.missions[this.id]) {
      Memory.missions[this.id] = {};
    }
    return Memory.missions[this.id];
  }

  set memory(value: {}) {
    if (!Memory.missions) {
      Memory.missions = {};
    }
    Memory.missions[this.id] = value;
  }

  get name(): string {
    return 'Mission ' + this.id;
  }

  private concludeSuccessfulMission(): void {
    const message = 'Mission: ' + this.name + ' was successful!';
    Game.notify(message, 1440);
    console.log(message);
    delete Memory.missions[this.id];
    delete Game.missions[this.id];
  }

  private concludeFailedMission(): void {
    const message = 'Mission: ' + this.name + ' failed.';
    Game.notify(message);
    console.log(message);
    delete Memory.missions[this.id];
    delete Game.missions[this.id];
  }

  private requisitionCreep(
    key: string,
    type: string,
    memory: {[key: string]: any},
    replenish: boolean,
  ): BaseUnit | null {
    const creep = this.creeps[key] || null;

    if (Game.time !== LastTick) {
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

  public provideCreep(key: string, creep: BaseUnit): void {
    this.creeps[key] = creep;
  }
}

export default Mission;
