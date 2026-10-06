import { defineConfig } from 'tsup'

const shared = {
  format: ['esm'],
  platform: 'node',
  sourcemap: true,
} as const

export default defineConfig([
  {
    ...shared,
    entry: { cli: 'src/cli.ts' },
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    ...shared,
    entry: { credentials: 'src/credentials/index.ts' },
    dts: { entry: { credentials: 'src/credentials/index.ts' } },
  },
])
