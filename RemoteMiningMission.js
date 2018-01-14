const Mission = require('Mission');

const RESERVE_NEEDED = 4500;
const ME = 'dougli';

class RemoteMiningMission extends Mission {
  static create(roomName) {
    return new RemoteMiningMission(null, {type: 'remote_mine', room: roomName});
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
    this._reserve();
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
}

module.exports = RemoteMiningMission;
