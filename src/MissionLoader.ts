import { DefenseMission } from 'DefenseMission';
import { RemoteMiningMission } from 'RemoteMiningMission';
import { ScoutMission } from 'ScoutMission';

export class MissionLoader {
  public static loadAll(): void {
    if (Game.missions) {
      return;
    }

    Game.missions = {};
    if (!Memory.missions) {
      return;
    }

    let mission: any;
    for (const id in Memory.missions) {
      const memory = Memory.missions[id];
      switch (memory.type) {
      case 'defense':
        mission = new DefenseMission(id, memory);
        break;
      case 'scout':
        mission = new ScoutMission(id, memory);
        break;
      case 'remote_mine':
        mission = new RemoteMiningMission(id, memory);
        break;
      default:
        console.log('Cannot deserialize mission ' + id);
        break;
      }
    }
  }
}
