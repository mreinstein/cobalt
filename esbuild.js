import esbuild  from 'esbuild'
import { glsl } from 'esbuild-plugin-glsl'


esbuild.build({
    entryPoints: [ 'src/cobalt.js' ],
    allowOverwrite: true,
    bundle: true,
    format: 'esm',
    target: 'es2022',
    plugins: [
        glsl({ minify: true })
    ],
    outfile: 'bundle.js',
    minify: false,
})
