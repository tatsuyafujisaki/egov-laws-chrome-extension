import {defineConfig} from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        content: 'src/content.ts',
        jump: 'src/jump.ts',
      },
      output: {
        entryFileNames: '[name].js',
        banner: '(function () {',
        footer: '})();',
      },
    },
    sourcemap: true,
    emptyOutDir: true,
  },
});
