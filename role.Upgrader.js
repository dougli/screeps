const BuildCosts = require('BuildCosts');
const BaseUnit = require('BaseUnit');
const Controllers = require('Controllers');
const Profiler = require('Profiler');

class Upgrader extends BaseUnit {
  static getIdealBuild(capacity) {
    return BuildCosts.getBestBuild(
      [MOVE, CARRY, WORK, WORK, WORK, MOVE, WORK, WORK, WORK, WORK,
       MOVE, WORK, WORK, WORK, WORK, MOVE, WORK, WORK, WORK, WORK,
       MOVE, CARRY, WORK, WORK, WORK],
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
    const creep = this.creep;
    const controller = this.getUpgradeTarget();
    const container = Controllers.getContainerFor(controller);
    const link = Controllers.getLinkFor(controller);
    const memory = creep.memory;

    if (controller.ticksToDowngrade <= 2000) {
      memory.forceUpgrade = true;
    } else if (memory.forceUpgrade && controller.ticksToDowngrade > 4000) {
      delete memory.forceUpgrade;
    }

    if (link && container) {
      creep.dismantle(container);
    } else if (link) {
      if (creep.carry[RESOURCE_ENERGY] <= this.getUpgradeSpeed()) {
        creep.withdraw(link, RESOURCE_ENERGY);
      }
    } else if (container) {
      // To save CPU, withdraw only when we need to
      if (creep.carry[RESOURCE_ENERGY] <= this.getUpgradeSpeed()) {
        creep.withdraw(container, RESOURCE_ENERGY);
      }

      const site = Controllers.getLinkSiteFor(controller);
      if (site) {
        if (creep.carry[RESOURCE_ENERGY] < creep.carryCapacity) {
          if (creep.dismantle(container) !== OK) {
            creep.moveToExperimental(container);
          }
        } else {
          if (creep.build(site) !== OK) {
            creep.moveToExperimental(site);
          }
        }
        return;
      } else if (container.hits < container.hitsMax) {
        creep.repair(container);
      }
    } else if (controller.level >= 2 && !memory.forceUpgrade) {
      // Build a container if it's not there if RCL >= 2
      const site = controller.level >= 5
            ? Controllers.getLinkSiteFor(controller)
            : Controllers.getContainerSiteFor(controller);
      if (site) {
        const result = creep.build(site);
        if (result == ERR_NOT_IN_RANGE || result == ERR_NOT_ENOUGH_RESOURCES) {
          creep.moveToExperimental(site);
        }
      }
      return;
    }

    const result = creep.upgradeController(controller);
    switch (result) {
    case ERR_NOT_IN_RANGE:
      creep.moveToExperimental(controller);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      if (container || link) {
        creep.moveToExperimental(container || link);
      } else {
        // Otherwise, just move closer to the controller
        creep.moveToExperimental(controller);
      }
      break;
    }
  }
}

Profiler.registerClass(Upgrader, 'Upgrader');

module.exports = Upgrader;
