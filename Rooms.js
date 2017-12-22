const Task = require('Task');

class Rooms {
  static getUpgraderFor(room) {
    return room.upgrader;
  }

  static getDropoffTasks(room) {
    const result = [];

    // First, prioritize structures that need juice
    var structures = room.find(FIND_MY_STRUCTURES);
    structures.forEach((structure) => {
      let amount = structure.energyCapacity - structure.energy;
      if (amount > 0) {
        result.push(new Task(Task.TRANSFER, structure, amount));
      }
    });
    if (result.length > 0) {
      return result;
    }

    // Then, prioritize builders

    // Finally, prioritize upgraders
    const upgrader = Rooms.getUpgraderFor(room);
    if (upgrader) {
      return [new Task(Task.TRANSFER, upgrader.creep, 1000)];
    }

    return [];
  }
}

module.exports = Rooms;
