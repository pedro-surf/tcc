import { readdirSync } from 'node:fs';
import path from 'node:path';

export function loadGqlObjects(
  callback: (mod: any) => void
) {
  const folderPath = path.join(__dirname, '..', 'objects');
  const files = readdirSync(folderPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

  for (const file of files) {
    const mod = require(path.join(folderPath, file)); // Use synchronous `require`
    const target = mod[`${file.split('.')[0]}Ref`];
    if (target) {
      callback(target);
    }
  }
}