import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { livestoreDevtoolsPlugin } from '@livestore/devtools-vite';
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		fs: { strict: false }
	},
	build: {
		target: 'esnext'
	},
	worker: { format: 'es' },
	optimizeDeps: {
		// Required for LiveStore's wa-sqlite
		exclude: ['@livestore/wa-sqlite']
	},
	plugins: [
		tailwindcss(),
		sveltekit(),
		livestoreDevtoolsPlugin({ schemaPath: './src/lib/livestore/schema.ts' })
	]
});
