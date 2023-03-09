import esbuild  from 'esbuild'
import { glsl } from 'esbuild-plugin-glsl'


const cfg = {
	entryPoints: [ 'src/cobalt.js' ],
	allowOverwrite: true,
    bundle: true,
    format: 'esm',
    target: 'es2022',
    plugins: [
        glsl({ minify: false })  // setting minify to true breaks the code
    ],
    outfile: 'bundle.js',
    minify: true,
}


esbuild.build(cfg)
