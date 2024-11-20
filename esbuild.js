import esbuild  from 'esbuild'
import { http } from '@hyrious/esbuild-plugin-http'
import { glsl } from 'esbuild-plugin-glsl'


esbuild.build({
    entryPoints: [ 'src/cobalt.js' ],
    allowOverwrite: true,
    bundle: true,
    format: 'esm',
    target: 'es2022',
    plugins: [
        glsl({ minify: true }),
        http()
    ],
    outfile: 'bundle.js',
    minify: true,
})
