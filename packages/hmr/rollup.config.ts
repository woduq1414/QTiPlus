import sucrase from '@rollup/plugin-sucrase';
import type { Plugin, RollupOptions } from 'rollup';

type SucrasePlugin = (options?: { exclude?: string[]; transforms?: string[] }) => Plugin;

const plugins = [
  (sucrase as unknown as SucrasePlugin)({
    exclude: ['node_modules/**'],
    transforms: ['typescript'],
  }),
] satisfies Plugin[];

export default [
  {
    plugins,
    input: 'lib/injections/reload.ts',
    output: {
      format: 'esm',
      file: 'dist/lib/injections/reload.js',
    },
  },
  {
    plugins,
    input: 'lib/injections/refresh.ts',
    output: {
      format: 'esm',
      file: 'dist/lib/injections/refresh.js',
    },
  },
] satisfies RollupOptions[];
