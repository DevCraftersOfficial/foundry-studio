import * as migration_20261022_155612_init from './20261022_155612_init';
import * as migration_20261022_170247_add_publishing_domain from './20261022_170247_add_publishing_domain';

export const migrations = [
  {
    up: migration_20261022_155612_init.up,
    down: migration_20261022_155612_init.down,
    name: '20261022_155612_init',
  },
  {
    up: migration_20261022_170247_add_publishing_domain.up,
    down: migration_20261022_170247_add_publishing_domain.down,
    name: '20261022_170247_add_publishing_domain'
  },
];
