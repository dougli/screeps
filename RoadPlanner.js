var DECAY_RATE = 0.99;
var BUILD_CUTOFF = 500;
var DEPOSIT_AMOUNT = 100;

var RoadPlanner = {
    addPheromones: function(creep) {
        var trails = creep.room.memory.trails;
        if (!trails) {
            trails = new Array(2500);
            creep.room.memory.trails = trails;
            for (var ii = 0; ii < trails.length; trails++) {
                trails[ii] = 0;
            }
        }
            
        var pos = creep.pos;
        var index = pos.x * 50 + pos.y;
        creep.room.memory.trails[index] += DEPOSIT_AMOUNT;
    },
    
    run: function() {
        for (var name in Game.rooms) {
            var room = Game.rooms[name];
            var trails = room.memory.trails;
            if (!trails) {
                continue;
            }
            
            var hasRoad = RoadPlanner._getRoadsHashMap(room, FIND_STRUCTURES);
            var hasRoadSite = RoadPlanner._getRoadsHashMap(room, FIND_CONSTRUCTION_SITES);
            
            var highest = 0; 
            var highestIndex = 0;
            for (var ii = 0; ii < trails.length; ii++) {
                trails[ii] *= DECAY_RATE;
                if (trails[ii] < 1) {
                    trails[ii] = 0;
                }
                if (trails[ii] > highest && !hasRoad[ii] && !hasRoadSite[ii]) {
                    highest = trails[ii];
                    highestIndex = ii;
                }
            }
            
            const c = room.controller;
            const shouldBuild = 
                (c && c.my) || 
                (c && !c.reservation && !room.hasAttackers()) ||
                (c && c.reservation && c.reservation.username == 'dougli');
            
            if (shouldBuild &&
                Object.keys(hasRoadSite).length <= 1 &&
                highest > BUILD_CUTOFF) {
                trails[highestIndex] = 0;
                var y = highestIndex % 50;
                var x = Math.floor(highestIndex / 50);
                var roadPos = new RoomPosition(x, y, name);
                roadPos.createConstructionSite(STRUCTURE_ROAD);
            }
        }
    },
    
    _getRoadsHashMap: function(room, findConst) {
        const result = {};
        room.find(findConst, {
            filter: {structureType: STRUCTURE_ROAD},
        }).forEach((road) => {
            const pos = road.pos;
            result[pos.x * 50 + pos.y] = true;
        });
        return result;
    },
}

module.exports = RoadPlanner;