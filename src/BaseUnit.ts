import * as Rooms from 'Rooms';
import * as Sources from 'Sources';
import { Task } from 'Task';
import { Walls } from 'Walls';

const PATH_REUSE = 10;

type TaskResult = OK | DONE | ERR_NOT_ENOUGH_RESOURCES;

declare global {
  interface Creep {
    replenishedBy?: BaseUnit;
  }

  interface CreepMemory {
    mission?: string;
    missionKey?: string;
    replenish?: string;
  }
}

abstract class BaseUnit {
  constructor(private readonly creep: Creep) {
    const replenishTarget = this.getReplenishTarget();
    if (replenishTarget) {
      replenishTarget.replenishedBy = this;
    }

    const mission = this.getMission();
    if (mission && !replenishTarget) {
      mission.provideCreep('' + this.getMissionKey(), this);
    }
  }

  get id(): string {
    return this.creep.id;
  }

  public isSpawning(): boolean {
    return this.creep.spawning;
  }

  public hasTask(): boolean {
    return !!this.getCurrentTask();
  }

  public getCurrentTask(): Task {
    return this.creep.tasks[0];
  }

  public setTask(task: Task): void {
    if (task) {
      this.creep.tasks = [task];
    }
  }

  public getMission(): Mission | null {
    const key = this.creep.memory.mission;
    return key ? Game.missions[key] : null;
  }

  public getMissionKey(): string | undefined {
    return this.creep.memory.missionKey;
  }

  public getReplenishTarget(): Creep | null {
    if (!this.creep.memory.replenish) {
      return null;
    }

    const target = Game.getObjectById<Creep>(this.creep.memory.replenish);
    if (!target) {
      delete this.creep.memory.replenish;
    }
    return target;
  }

  public getReplenishedBy(): BaseUnit | undefined {
    return this.creep.replenishedBy;
  }

  protected moveToReplenishTarget(): boolean {
    const target = this.getReplenishTarget();
    target && this.creep.moveToExperimental(target);
    return !!target;
  }

  public isDyingSoon(): boolean {
    return !!this.creep.ticksToLive &&
      this.creep.ticksToLive <= this.creep.body.length * 3;
  }

  protected _doTask(): TaskResult {
    const ACTION_MAP = {
      [Task.PICKUP]: this._pickup,
      [Task.TRANSFER]: this._transfer,
      [Task.SCOUT]: this._scout,
      [Task.REPAIR]: this._repair,
      [Task.BUILD]: this._build,
      // [Task.UPGRADE]: this._upgrade,
    };

    const task = this.getCurrentTask();
    if (task) {
      const result = ACTION_MAP[task.type].apply(this, [task]);
      if (result === DONE) {
        this.creep.tasks.shift();
      }
      return result;
    }

    return DONE;
  }

  public run(): void {
    const creep = this.creep;

    // Pickup nearby jonx
    const nearbyEnergy = creep.pos.findInRange(FIND_DROPPED_RESOURCES, 1);
    if (nearbyEnergy.length > 0) {
      if (creep.memory.role === 'builder' || creep.memory.role === 'upgrader') {
        creep.pickup(nearbyEnergy[0]);
      } else {
        const nearbyCreeps = creep.pos.findInRange(FIND_MY_CREEPS, 2);
        const nearBuilder = nearbyCreeps.some((c) => {
          return c.memory.role === 'builder' || c.memory.role === 'upgrader';
        });
        if (!nearBuilder) {
          creep.pickup(nearbyEnergy[0]);
        }
      }
    }

    this._tick();
  }

  protected abstract _tick(): void;

  private _pickup(task: Task): TaskResult {
    const creep = this.creep;
    const needed = creep.carryCapacity - creep.carry.energy;
    if (needed === 0) {
      return DONE;
    }

    // Prioritize containers, then miners
    if (task.target instanceof Source) {
      const container = Sources.getContainerFor(task.target);
      if (container) {
        task.target = container;
      } else if (Sources.getMinersFor(task.target).length) {
        const miner = Sources.getMinersFor(task.target)[0].creep;
        creep.moveToExperimental(miner);
        return OK;
      }
    }

    if (task.target instanceof StructureContainer ||
        task.target instanceof StructureStorage) {
      if (!creep.pos.isNearTo(task.target)) {
        creep.moveToExperimental(task.target);
        return OK;
      }

      // Wait until we have enough to withdraw to save CPU
      const available = task.target.store[RESOURCE_ENERGY];
      if (available < needed) {
        return OK;
      }

      switch (creep.withdraw(task.target, RESOURCE_ENERGY, needed)) {
      case OK:
      default:
        return DONE;
      }
    } else {
      creep.moveToExperimental(task.target);
      return OK;
    }
  }

  private _transfer(task: Task): TaskResult {
    const creep = this.creep;
    const target = task.target;

    if (target instanceof Creep) {
      if (creep.pos.isNearTo(target)) {
        creep.drop(RESOURCE_ENERGY);
        return ERR_NOT_ENOUGH_RESOURCES;
      } else {
        creep.moveToExperimental(target);
        return OK;
      }
    }

    const currentEnergy = creep.carry.energy;
    const needed = target.energyCapacity - target.energy;
    const amount = Math.min(needed, task.amount, currentEnergy);

    if (amount <= 0) {
      return currentEnergy === 0 ? ERR_NOT_ENOUGH_RESOURCES : DONE;
    }

    switch (creep.transfer(target, RESOURCE_ENERGY, amount)) {
    case ERR_NOT_ENOUGH_RESOURCES:
      return ERR_NOT_ENOUGH_RESOURCES;
    case OK:
      if (amount >= currentEnergy) {
        return ERR_NOT_ENOUGH_RESOURCES;
      } else {
        return DONE;
      }
    case ERR_NOT_IN_RANGE:
      creep.moveToExperimental(target);
      return OK;
    case ERR_INVALID_TARGET:
    case ERR_FULL:
    default:
      return DONE;
    }
  }

  private _scout(task: Task): TaskResult {
    const creep = this.creep;
    const targetRoom = task.target;
    const pos = this.creep.pos;
    if (pos.roomName === targetRoom &&
        pos.x > 0 && pos.x < 49 && pos.y > 0 && pos.y < 49) {
      return DONE;
    }

    this.creep.moveToRoom(targetRoom);
    return OK;
  }

  private _repair(task: Task): TaskResult {
    const creep = this.creep;
    const energy = creep.carry.energy;
    if (task.target.hits === task.target.hitsMax ||
        task.target.hits >= task.amount) {
      return DONE;
    }

    switch (creep.repair(task.target)) {
    case OK:
      return energy <= creep.getActiveBodyparts(WORK)
        ? ERR_NOT_ENOUGH_RESOURCES
        : OK;
    case ERR_NOT_IN_RANGE:
      creep.moveToExperimental(task.target);
      return OK;
    case ERR_NOT_ENOUGH_RESOURCES:
      return ERR_NOT_ENOUGH_RESOURCES;
    case ERR_INVALID_TARGET:
    default:
      return DONE;
    }
  }

  private _build(task: Task): TaskResult {
    const creep = this.creep;
    const energy = creep.carry.energy;

    switch (creep.build(task.target)) {
    case OK:
      return energy <= creep.getActiveBodyparts(WORK) * 5
        ? ERR_NOT_ENOUGH_RESOURCES
        : OK;
    case ERR_NOT_IN_RANGE:
      creep.moveToExperimental(task.target);
      return OK;
    case ERR_NOT_ENOUGH_RESOURCES:
      creep.moveToExperimental(task.target);
      return ERR_NOT_ENOUGH_RESOURCES;
    case ERR_INVALID_TARGET:
    default:
      return DONE;
    }
  }
}

export { BaseUnit };
export default BaseUnit;
