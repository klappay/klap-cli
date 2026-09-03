import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  platform: 'node',
  banner: { js: '#!/usr/bin/env node' },
  clean: true,
  sourcemap: true,
})
