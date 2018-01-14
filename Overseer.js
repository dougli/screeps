const Controllers = require('Controllers');
const DefenseMission = require('DefenseMission');
const Rooms = require('Rooms');
const ScoutMission = require('ScoutMission');
const Sources = require('Sources');
const Profiler = require('Profiler');

const SCOUT_DELAY = 23;
const ME = 'dougli';

const Overseer = {
  run: function() {
    for (const name in Game.rooms) {
      const room = Game.rooms[name];
      const memory = Memory.rooms[name];
      const mine = room && room.controller && room.controller.my;

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
          !Rooms.getScoutMissionFrom(room) &&
          ScoutMission.shouldScout(name)) {
        ScoutMission.create(name);
      }

      if (!memory || !memory.lastSeen) {
        room.find(FIND_SOURCES).forEach(source => {
          Sources.getMemoryFor(source);
        });
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
