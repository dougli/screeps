var Task = require('Task');

class TaskList {
  constructor() {
    this.reset();
  }

  // Screeps doesn't like singletons! Weird state sometimes gets carried
  // between turns, probably due to some server-side optimization.
  reset() {
    this.list = [];
  }

  add(type, target, amount, priority = 10, quantity = 1) {
    this.list.push(new Task(type, target, amount, quantity, priority));
  }

  addPickupTask(type, target, amount, priority) {
    if (priority >= 0) {
      throw new Exception('Pickup tasks have negative priority');
    }
    this.list.push(new Task(type, target, amount, 8, priority));
  }

  sort() {
    this.list = this.list.sort((a, b) => {
      const pDiff = b.priority - a.priority;
      if (pDiff != 0) {
        return pDiff;
      }

      if (a.type === Task.BUILD && b.type === Task.BUILD) {
        return a.amount - b.amount;
      }
    });
  }

  decrementAssigned() {
    const creeps = Game.creeps;
    for (let name in creeps) {
      let creep = creeps[name];
      this._decrementTask(creep.task);
    }
  }

  _decrementTask(task) {
    if (!task) {
      return;
    }

    var idx = this.list.findIndex((item) => item.id === task.id);
    if (idx >= 0) {
      var sub = this.list[idx].subtract(task);
      if (!sub) {
        this.list.splice(idx, 1);
      } else {
        this.list[idx] = sub;
      }
    }
  }

  decrementCreepTasks(creep) {
    creep.tasks.forEach((task) => this._decrementTask(task));
  }

  findNearbyTasks(pos, types, minAmount = 1, roomRange = 1) {
    let inSameRoom = false;

    let tasks = this.list.filter((task) => {
      if (types.indexOf(task.type) === -1 ||
          task.amount < minAmount) {
        return false;
      }

      var roomDistance = Game.map.getRoomLinearDistance(
        pos.roomName,
        task.target.room.name
      ) || 0;
      inSameRoom = inSameRoom || roomDistance === 0;

      return roomDistance <= roomRange;
    });

    if (inSameRoom) {
      tasks = tasks.filter((task) => {
        switch (task.type) {
        case Task.REPAIR:
        case Task.BUILD:
          return true;
        default:
          return pos.roomName === task.target.room.name;
        }
      }).sort((a, b) => {
        const pDiff = b.priority - a.priority;
        if (pDiff !== 0) {
          return pDiff;
        }

        if (a.type === Task.BUILD) {
          return a.amount - b.amount;
        }

        return pos.getRangeTo(a.target) - pos.getRangeTo(b.target);
      });
    }

    return tasks;
  }

  getBuildTask(creep) {
    const pos = creep.pos;
    const tasks = this.findNearbyTasks(pos, [Task.BUILD]);
    return tasks[0];
  }

  getPickupTask(creep, creepEnergy, harvest = true) {
    const pos = creep.pos;
    const amount = creep.carryCapacity - creepEnergy;
    const tasks = this.findNearbyTasks(pos, [Task.PICKUP], amount);
    if (tasks.length > 0) {
      let targets = tasks.map((task) => task.target);
      let target = pos.findClosestByRange(targets) || targets[0];
      let result = new Task(Task.PICKUP, target, amount);
      this._decrementTask(result);
      return [result];
    }

    if (!harvest) {
      return [];
    }

    var waits = this.findNearbyTasks(pos, [Task.WAIT_PICKUP], amount);
    if (waits.length > 0) {
      let targets = waits.map((task) => task.target);
      let target = pos.findClosestByRange(targets) || targets[0];
      let result = new Task(Task.WAIT_PICKUP, target, amount);
      this._decrementTask(result);
      return [result];
    }

    return [];
  }

  getWorkTasks(creep) {
    const result = [];

    let energyRemaining = creep.carry.energy;
    let tasks = this.findNearbyTasks(
      creep.pos,
      [Task.TRANSFER, Task.REPAIR, Task.BUILD, Task.UPGRADE]
    );
    tasks = tasks.filter((task) => {
      if (task.type !== Task.TRANSFER) {
        return true;
      }

      const mule = Game.getObjectById(task.target.room.memory.mule);
      return !mule;
    });

    let newTask = null;
    for (let task of tasks) {
      if (energyRemaining <= 0) {
        break;
      }

      let creepAmount = Math.min(task.amount, energyRemaining);
      newTask = new Task(task.type, task.target, creepAmount);
      this._decrementTask(newTask);
      result.push(newTask);
      energyRemaining -= creepAmount;
    }

    return result;
  }

  report() {
    this.sort();
    if (this.list.length > 0) {
      console.log(this.list.length, 'Top task:', this.list[0].type);
    }
  }
}

module.exports = new TaskList();
