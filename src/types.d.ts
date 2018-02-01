// type shim for nodejs' `require()` syntax
declare const require: (module: string) => any;

interface CreepMemory {
  [name: string]: any;
}

interface FlagMemory {
  [name: string]: any;
}

interface SpawnMemory {
  [name: string]: any;
}

interface RoomMemory {
  [name: string]: any;
}

interface Game {
  missions: Mission[];
}

interface Mission {
  run: () => void;
}

interface BaseUnit {
  isDyingSoon: () => boolean;
  getReplenishedBy: () => BaseUnit;
  creep: Creep;
}
