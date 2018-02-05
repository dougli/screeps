// type shim for nodejs' `require()` syntax
declare const require: (module: string) => any;

interface CreepMemory {
  role: string;
}

interface RoomMemory {
  [name: string]: any;
}

interface BaseUnit {
  getReplenishedBy: () => BaseUnit | undefined;
  hasTask: () => boolean;
  isDyingSoon: () => boolean;
  readonly id: string;
}

interface Mission {
  provideCreep: (key: string, creep: BaseUnit) => void;
}

type DONE = 1;
declare const DONE = 1;

interface BuildPlan {
  x: number;
  y: number;
  type: BuildableStructureConstant;
}
