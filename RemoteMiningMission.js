const Mission = require('Mission');

const RESERVE_NEEDED = 4500;
const ME = 'dougli';

class RemoteMiningMission extends Mission {
  static create(base, roomName) {
    return new RemoteMiningMission(
      null,
      {type: 'remote_mine', base, room: roomName}
    );
  }

  static deserialize(id, memory) {
    return new RemoteMiningMission(id, memory);
  }

  constructor(id, memory) {
    super(id, memory);
  }

  get name() {
    return 'Remotely mine ' + this.memory.room;
  }

  run() {
    const room = Game.rooms[this.memory.room];
    if (!room || room.find(FIND_HOSTILE_CREEPS).length > 0) {
      this._defend();
      return;
    }

    this._reserve();
    const memory = Memory.rooms[this.memory.room];
    for (const id in memory.sources) {
      this._mine(id, memory.sources[id]);
    }
  }

  _defend() {
    if (!this.creeps.defender) {
      this.requisitionCreep('defender', 'defender', {
        defendTarget: this.memory.room,
      });
    }
  }

  _reserve() {
    if (this.creeps.claimer && !this.creeps.claimer.getReserveTarget()) {
      this.creeps.claimer.setReserveTarget(this.memory.room);
    }

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

    if (reserveNeeded && !this.creeps.claimer) {
      this.requisitionCreep('claimer', 'claimer');
    }
  }

  _mine(sourceID, memory) {
    const minerID = 'miner_' + sourceID;
    const muleID = 'mule_' + sourceID;
    if (!this.creeps[minerID]) {
      this.requisitionCreep(
        minerID,
        'miner',
        {harvestTarget: sourceID, harvestRoom: this.memory.room}
      );
    }

    if (!this.creeps[muleID]) {
      this.requisitionCreep(muleID, 'mule', {
        haulTarget: sourceID,
        haulRoom: this.memory.room,
        base: this.memory.base
      });
    }
  }
}

module.exports = RemoteMiningMission;
