import { exec } from 'node:child_process';

const name = process.argv[2];

if (name === undefined) {
  throw new Error("Migration's name must be provided!");
}

exec(
  `typeorm-ts-node-esm migration:create ./database/migrations/${name}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`Error: ${error.message}`);
      return;
    }

    if (stderr) {
      console.error(stderr);
    }

    console.log(stdout);
  },
);
