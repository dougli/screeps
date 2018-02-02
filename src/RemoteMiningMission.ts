import { Mission } from 'Mission';
import { Claimer } from 'role.Claimer';
import { Mule } from 'role.Mule';

const RESERVE_NEEDED = 3000;
const ME = 'dougli';

export class RemoteMiningMission extends Mission {
  public static create(base: string, roomName: string): RemoteMiningMission {
    return new RemoteMiningMission(
      null,
      {type: 'remote_mine', base, room: roomName},
    );
  }

  get name(): string {
    return 'Remotely mine ' + this.memory.room;
  }

  public run(): void {
    if (!Game.rooms[this.memory.base]) {
      this.concludeFailedMission();
      return;
    }

    const room = Game.rooms[this.memory.room];
    if (!room || room.find(FIND_HOSTILE_CREEPS).length > 0) {
      this._defend();
      return;
    }

    this._reserve();
    const memory = Memory.rooms[this.memory.room];
    for (const id in memory.sources) {
      this._mine(id);
    }
  }

  private _defend(): void {
    this.requisitionCreep('defender', 'defender', {
      defendTarget: this.memory.room,
    });
  }

  private _reserve(): void {
    let reserveNeeded = false;
    const room = Game.rooms[this.memory.room];
    const controller = room && room.controller;
    if (!controller) {
      reserveNeeded = true;
    } else if (controller.my) {
      reserveNeeded = false;
    } else if (!controller.reservation) {
      reserveNeeded = true;
    } else if (controller.reservation.username !== ME) {
      this.concludeFailedMission();
      return;
    } else if (controller.reservation.ticksToEnd < RESERVE_NEEDED) {
      reserveNeeded = true;
    }

    if (reserveNeeded) {
      const claimer = this.requisitionCreep<Claimer>('claimer', 'claimer');
      if (claimer) {
        claimer.setReserveTarget(this.memory.room);
      }
    }
  }

  private _mine(sourceID: string): void {
    const minerID = 'miner_' + sourceID;
    const muleID = 'mule_' + sourceID;
    this.requisitionCreep(
      minerID,
      'miner',
      {harvestTarget: sourceID, harvestRoom: this.memory.room},
      true,
    );

    let haulSpeedRemaining = 10;
    let muleNum = 1;
    while (haulSpeedRemaining > 1) {
      const mule = this.requisitionCreep<Mule>(muleID + '_' + muleNum, 'mule', {
        base: this.memory.base,
        haulRoom: this.memory.room,
        haulTarget: sourceID,
      }, true);

      if (!mule) {
        break;
      }

      haulSpeedRemaining -= mule.getMuleSpeed();
      muleNum++;
    }
  }
}
