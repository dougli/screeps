class Task {
  constructor(type, target, amount = 10000, quantity = 8, priority = 10) {
    if (!type) {
      throw new Error('Missing task type');
    }
    if (!target) {
      throw new Error('Missing task target');
    }
    this.type = type;
    this.target = target;
    this.amount = amount;
    this.quantity = quantity;
    this.priority = priority;
  }

  get id() {
    if (this.type === Task.SCOUT) {
      return this.type + ':' + this.target;
    }
    return this.type + ':' + this.target.id;
  }

  subtract(other) {
    var amt = this.amount - other.amount;
    var quantity = this.quantity - other.quantity;

    if (amt <= 0 || quantity <= 0) {
      return null;
    }
    return new Task(this.type, this.target, amt, quantity, this.priority);
  }

  serializeForCreep() {
    var target = this.type === Task.SCOUT ? this.target : this.target.id;
    return {t: this.type, tg: target, a: this.amount};
  }

  static deserializeForCreep(data) {
    var target = data.t === Task.SCOUT
        ? data.tg
        : Game.getObjectById(data.tg);
    if (!target) {
      return null;
    }
    return new Task(data.t, target, data.a, 1, -1);
  }
}

Object.assign(Task, {
  HARVEST: 'harvest',
  PICKUP: 'pickup',
  WAIT_PICKUP: 'wait_pickup',
  TRANSFER: 'transfer',
  REPAIR: 'repair',
  BUILD: 'build',
  UPGRADE: 'upgrade',
  SCOUT: 'scout',
});

module.exports = Task;
