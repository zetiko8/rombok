// the @nx/js:tsc always creates a package.json in the dist
// I don't know how to disable it.
// Use this script to remove them
import { unlinkSync, existsSync } from 'fs';

const bundles = [
  'esm',
  'cjs',
  'types',
];

bundles.forEach(bundleName => {
  const jsonFile = './library/dist/' + bundleName + '/package.json';
  if (existsSync(jsonFile)) {
    unlinkSync(jsonFile);
  }
});

