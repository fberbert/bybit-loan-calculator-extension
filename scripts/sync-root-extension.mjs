import { cp, mkdir, rm } from 'node:fs/promises';

await rm('assets', { recursive: true, force: true });
await rm('icons', { recursive: true, force: true });
await mkdir('assets', { recursive: true });
await mkdir('icons', { recursive: true });
await cp('dist/assets', 'assets', { recursive: true });
await cp('dist/icons', 'icons', { recursive: true });
