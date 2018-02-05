let REQUESTED_CREEPS: MissionRequisition[] = [];
let LastTick = 0;

declare global {
  interface Game {
    missions: {[id: string]: Mission};
  }
}

interface MissionRequisition {
  mission: Mission;
  key: string;
  type: string;
  memory: {};
}

export abstract class Mission {
  private id: string;
  private units: {
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
    this.units = {};
    Game.missions[this.id] = this;
  }

  get memory(): {[key: string]: any} {
    if (!Memory.missions) {
      Memory.missions = {};
    }
    if (!Memory.missions[this.id]) {
      Memory.missions[this.id] = {};
    }
    return Memory.missions[this.id];
  }

  set memory(value: {[key: string]: any}) {
    if (!Memory.missions) {
      Memory.missions = {};
    }
    Memory.missions[this.id] = value;
  }

  get name(): string {
    return 'Mission ' + this.id;
  }

  public abstract run(): void;

  protected concludeSuccessfulMission(): void {
    const message = 'Mission: ' + this.name + ' was successful!';
    Game.notify(message, 1440);
    console.log(message);
    delete Memory.missions[this.id];
    delete Game.missions[this.id];
  }

  protected concludeFailedMission(): void {
    const message = 'Mission: ' + this.name + ' failed.';
    Game.notify(message);
    console.log(message);
    delete Memory.missions[this.id];
    delete Game.missions[this.id];
  }

  protected requisitionCreep<T extends BaseUnit>(
    key: string,
    type: string,
    memory?: {[key: string]: any},
    replenish?: boolean,
  ): T | null {
    const unit = this.units[key] || null;

    if (Game.time !== LastTick) {
      REQUESTED_CREEPS = [];
      LastTick = Game.time;
    }

    memory = memory || {};

    if (!unit ||
        (replenish && unit.isDyingSoon() && !unit.getReplenishedBy())) {
      if (replenish && unit) {
        memory.replenish = unit.id;
      }

      REQUESTED_CREEPS.push({mission: this, key, type, memory});
    }

    return unit as T;
  }

  public provideCreep(key: string, creep: BaseUnit): void {
    this.units[key] = creep;
  }
}

export default Mission; // TODO: Kill. Here only for backwards compatibility
