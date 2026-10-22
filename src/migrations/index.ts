import * as migration_20261022_155612_init from './20261022_155612_init';

export const migrations = [
  {
    up: migration_20261022_155612_init.up,
    down: migration_20261022_155612_init.down,
    name: '20261022_155612_init'
  },
];
