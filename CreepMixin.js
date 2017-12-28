var RoadPlanner = require('RoadPlanner');
var Task = require('Task');

var MAX_REUSE_PATH = 10;

module.exports = {
  run: function() {
    Creep.prototype.moveToWithTrail = function(target, opts) {
      if (!opts) {
        opts = {};
      }
      opts.reusePath = opts.reusePath || MAX_REUSE_PATH;
      this.moveTo(target, opts);
      RoadPlanner.addPheromones(this);
    };

    Creep.prototype.getType = function() {
      return this.memory.role;
    };

    Creep.prototype.save = function() {
      this.memory.tasks = this.tasks.map(
        (task) => task.serializeForCreep()
      );
    };

    Object.defineProperty(Creep.prototype, 'tasks', {
      get: function() {
        if (!this._tasksLoaded) {
          var memory = this.memory.tasks || [];
          this._tasks = (this.memory.tasks || [])
            .map(Task.deserializeForCreep)
            .filter((t) => t);
          this._tasksLoaded = true;
        }
        return this._tasks;
      },

      set: function(tasks) {
        this._tasks = tasks;
      },
    });
  }
};
