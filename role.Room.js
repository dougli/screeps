const Task = require('Task');
const TaskList = require('TaskList');
const ExpansionPlanner = require('ExpansionPlanner');

var UPGRADE_TICKDOWN_PRIORITY = 100;
var TRANSFER_PRIORITY = {
    [STRUCTURE_TOWER]: 42,
    [STRUCTURE_EXTENSION]: 41,
    [STRUCTURE_SPAWN]: 40,
}
var REPAIR_CORE_PRIORITY = 31;
var REPAIR_PRIORITY = 30;
var BUILD_PRIORITY = {
    [STRUCTURE_SPAWN]: 15,
    [STRUCTURE_TOWER]: 14,
    [STRUCTURE_RAMPART]: 13,
    [STRUCTURE_WALL]: 12,
    [STRUCTURE_ROAD]: 11,
    [STRUCTURE_EXTENSION]: 10,
};
var UPGRADE_PRIORITY = 0;
var PICKUP_PRIORITY = -10;
var WAIT_PICKUP_PRIORITY = -20;

var WALL_HEALTH = [
    0,
    1000,
    10000,
    20000, 
    80000,
    160000,
    160000,
    160000,
    160000
];

var ROOM_STATUS = {
    FRIENDLY_SPAWN: 'friendly_spawn',
    FRIENDLY_CLAIM: 'friendly_claim',
    FRIENDLY_NEUTRAL: 'friendly_neutral',
    NEUTRAL: 'neutral',
    HOSTILE_NEUTRAL: 'hostile_neutral',
    HOSTILE_CLAIM: 'hostile_claim',
    HOSTILE_SPAWN: 'hostile_spawn',
}

function shouldRepair(structure) {
    if (!structure || structure.hits == structure.hitsMax) {
        return false;
    }
    
    var level = structure.room.controller ? structure.room.controller.level : 0;
    
    if (structure.structureType === STRUCTURE_CONTAINER) {
        return structure.hits < structure.hitsMax * 0.5;
    } else if (structure.structureType === STRUCTURE_RAMPART) {
        return structure.hits < WALL_HEALTH[level] * 0.9;
    } else if (structure.structureType === STRUCTURE_ROAD) {
        return structure.hits < structure.hitsMax * 0.5;
    } else if (structure.structureType === STRUCTURE_WALL) {
        return structure.hits < WALL_HEALTH[level];
    }
    
    return true;
}

var RoomRole = {
    addPickupTasks: function(room) {
        var sources = room.find(FIND_SOURCES);
        sources.forEach((source) => {
            var config = (room.memory.sources && room.memory.sources[source.id]) || {};
            var container = Game.getObjectById(config.container);
            if (container) {
                var energy = container.store[RESOURCE_ENERGY];
                if (energy > 0) {
                    TaskList.addPickupTask(Task.PICKUP, container, energy, PICKUP_PRIORITY);
                }
                return;
            }
            
            TaskList.addPickupTask(Task.WAIT_PICKUP, source, source.energy || 1, WAIT_PICKUP_PRIORITY, 4);
        });
    },
    
    addTransferTasks: function(room) {
        var structures = room.find(FIND_MY_STRUCTURES);
        structures.forEach((structure) => {
            let amount = structure.energyCapacity - structure.energy;
            let priority = TRANSFER_PRIORITY[structure.structureType];
            if (amount > 0 && priority) {
                TaskList.add(Task.TRANSFER, structure, amount, priority, 8);
            }
        });
    },
    
    addRepairTasks: function(room) {
        var structures = room.find(FIND_MY_STRUCTURES);
        for (var ii = 0; ii < structures.length; ii++) {
            var structure = structures[ii];
            if (shouldRepair(structure)) {
                TaskList.add(
                    Task.REPAIR, 
                    structure, 
                    structure.hitsMax - structure.hits,
                    REPAIR_CORE_PRIORITY
                );
            }
        }
        
        if ((room.controller && room.controller.my) || !room.hasAttackers()) {
            var other = room.find(FIND_STRUCTURES);
            for (var ii = 0; ii < other.length; ii++) {
                if (shouldRepair(other[ii])) {
                    var max = other[ii].hitsMax;
                    if (other[ii].structureType === STRUCTURE_RAMPART ||
                        other[ii].structureType === STRUCTURE_WALL) {
                            max = WALL_HEALTH[room.controller.level];
                    }
                    TaskList.add(
                        Task.REPAIR, 
                        other[ii], 
                        max - other[ii].hits,
                        REPAIR_PRIORITY
                    );
                }
            }
        }
    },
    
    addBuildTasks: function(room) {
        var sites = room.find(FIND_CONSTRUCTION_SITES);
        sites.forEach(function(site) {
            var amount = site.progressTotal - site.progress;
            var quantity = site.structureType === STRUCTURE_ROAD ? 2 : 8;
            var priority = BUILD_PRIORITY[site.structureType];
            if (priority) {
                TaskList.add(Task.BUILD, site, amount, priority, quantity);
            }
        });
    },
    
    addUpgradeTasks: function(room) {
        if (room.controller && room.controller.my) {
            var priority = room.controller.ticksToDowngrade < 4000
                ? UPGRADE_TICKDOWN_PRIORITY
                : UPGRADE_PRIORITY;
            TaskList.add(
                Task.UPGRADE, 
                room.controller, 
                Number.POSITIVE_INFINITY, 
                priority, 
                8
            );
        }
    },
    
    run: function(room) {
        const c = room.controller;
        
        if ((c && c.my) || 
            (c && c.reservation && c.reservation.username === 'dougli') || 
            (c && !c.owner && !c.reservation) || 
            (!c && !room.hasAttackers())) {
            RoomRole.addPickupTasks(room);
            RoomRole.addTransferTasks(room);
            RoomRole.addRepairTasks(room);
            RoomRole.addBuildTasks(room);
            RoomRole.addUpgradeTasks(room);
        }
    },
};

module.exports = RoomRole;