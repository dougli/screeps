// type shim for nodejs' `require()` syntax
declare const require: (module: string) => any;

interface CreepMemory {
  role: string;
}

interface RoomMemory {
  [name: string]: any;
}

interface BaseUnit {
  isDyingSoon: () => boolean;
  getReplenishedBy: () => BaseUnit;
  hasTask: () => boolean;
  creep: Creep;
}
