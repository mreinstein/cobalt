import esbuild  from 'esbuild'
import { glsl } from 'esbuild-plugin-glsl'


const minify = false

const cfg = {
	entryPoints: [ 'src/cobalt.js' ],
	allowOverwrite: true,
    bundle: true,
    format: 'esm',
    target: 'es2022',
    plugins: [
        glsl({ minify })
    ],
    outfile: 'bundle.js',
    minify,
}


esbuild.build(cfg)
