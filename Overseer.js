const Controllers = require('Controllers');
const DefenseMission = require('DefenseMission');
const Rooms = require('Rooms');
const ScoutMission = require('ScoutMission');
const Sources = require('Sources');
const Profiler = require('Profiler');

const SCOUT_MIN_RCL = 3;
const SCOUT_DELAY = 23;
const ME = 'dougli';

const Overseer = {
  run: function() {
    if (!Memory.rooms) {
      Memory.rooms = {};
    }

    for (const name in Game.rooms) {
      const room = Game.rooms[name];
      let memory = Memory.rooms[name];
      const mine = room && room.controller && room.controller.my;

      if (!memory || !memory.lastSeen) {
        Memory.rooms[name] = {};
        memory = Memory.rooms[name];
        room.find(FIND_SOURCES).forEach(source => {
          Sources.getMemoryFor(source);
        });
      }

      // If it's my room, see if I have to defend it
      if (mine && !Rooms.getDefenseMission(room)) {
        const hostiles = room.find(FIND_HOSTILE_CREEPS);
        if (hostiles.length) {
          DefenseMission.create(name);
        }
      }

      // Scout rooms if we haven't seen it in a while
      if (mine &&
          Game.time % SCOUT_DELAY === 0 &&
          room.controller.level >= SCOUT_MIN_RCL &&
          !Rooms.getScoutMissionFrom(room) &&
          ScoutMission.shouldScout(name)) {
        ScoutMission.create(name);
      }

      const owner = Controllers.getOwner(room.controller);
      if (owner && owner != ME) {
        memory.hostile = true;
      } else {
        delete memory.hostile;
      }

      memory.lastSeen = Game.time;
    }
  },
};

Profiler.registerObject(Overseer, 'Overseer');

module.exports = Overseer;
