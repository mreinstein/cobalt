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
        // minifying used to break the code for some reason, but I think it's fixed
        // so I'll re-enable this and see how it goes!
        glsl({ minify: true }),
        http()
    ],
    outfile: 'bundle.js',
    minify: true,
})
