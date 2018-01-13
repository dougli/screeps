class Mission {
  constructor(id, memory) {
    this.id = id || Math.random().toString(16).substr(2);
    this.memory = memory || {};
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
    Game.notify(message);
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
}

module.exports = Mission;
