const BuildCosts = require('BuildCosts');
const BaseUnit = require('BaseUnit');
const Controllers = require('Controllers');
const Profiler = require('Profiler');

class Upgrader extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, MOVE, WORK, WORK, WORK, WORK,
       MOVE, WORK, WORK, WORK, WORK, MOVE, WORK, WORK, WORK, WORK],
      capacity);
  }

  constructor(creep) {
    super(creep);

    if (!creep.room.controller.upgraders) {
      creep.room.controller.upgraders = [];
    }
    creep.room.controller.upgraders.push(this);
  }

  getUpgradeTarget() {
    return Game.getObjectById(this.creep.memory.upgradeTarget);
  }

  getUpgradeSpeed() {
    return this.creep.getActiveBodyparts(WORK);
  }

  _tick() {
    const controller = this.getUpgradeTarget();
    const container = Controllers.getContainerFor(controller);
    const memory = this.creep.memory;

    if (controller.ticksToDowngrade <= 2000) {
      memory.forceUpgrade = true;
    } else if (memory.forceUpgrade && controller.ticksToDowngrade > 4000) {
      delete memory.forceUpgrade;
    }

    if (container) {
      // To save CPU, withdraw only when we need to
      if (this.creep.carry[RESOURCE_ENERGY] <= this.getUpgradeSpeed()) {
        this.creep.withdraw(container, RESOURCE_ENERGY);
      }
      if (container.hits < container.hitsMax) {
        this.creep.repair(container);
      }
    } else if (controller.level >= 2 && !memory.forceUpgrade) {
      // Build a container if it's not there if RCL >= 2
      const site = Controllers.getContainerSiteFor(controller);
      if (site) {
        const result = this.creep.build(site);
        if (result == ERR_NOT_IN_RANGE || result == ERR_NOT_ENOUGH_RESOURCES) {
          this.creep.moveToExperimental(site);
        }
      }
      return;
    }

    const result = this.creep.upgradeController(controller);
    switch (result) {
    case ERR_NOT_IN_RANGE:
      this.creep.moveToExperimental(controller);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      if (container) {
        this.creep.moveToExperimental(container);
      } else {
        // Otherwise, just move closer to the controller
        this.creep.moveToExperimental(controller);
      }
      break;
    }
  }
}

Profiler.registerClass(Upgrader, 'Upgrader');

module.exports = Upgrader;
