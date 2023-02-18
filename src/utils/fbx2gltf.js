/**
* Copyright (c) 2014-present, Facebook, Inc.
* All rights reserved.
*/

const childProcess = require('child_process')
const fs = require('fs')
const os = require('os')
const path = require('path')
const rimraf = require('rimraf')

/**
 * Converts an FBX to a GTLF or GLB file.
 * @param string srcFile path to the source file.
 * @param string destFile path to the destination file.
 * This must end in `.glb` or `.gltf` (case matters).
 * @param string[] [opts] options to pass to the converter tool.
 * @return Promise<string> a promise that yields the full path to the converted
 * file, an error on conversion failure.
 */
const isDev = process.env.NODE_ENV && process.env.NODE_ENV !== 'production'
function convert(srcFile, destFile, opts = []) {
    return new Promise((resolve, reject) => {
        try {
            const binExt = os.type() === 'Windows_NT' ? '.exe' : ''
            // eslint-disable-next-line no-undef
            const tool = isDev ? path.join(__static, 'bin', os.type(), 'FBX2glTF' + binExt) : path.join(process.resourcesPath, 'app.asar.unpacked/source', 'bin', os.type(), 'FBX2glTF' + binExt)
            // let tool = path.join(__dirname, 'bin', os.type(), 'FBX2glTF' + binExt);
            if (!fs.existsSync(tool)) {
                throw new Error(`Unsupported OS: ${os.type()}`)
            }

            let destExt
            if (destFile.endsWith('.glb')) {
                destExt = '.glb'
                opts.includes('--binary') || opts.push('--binary')
            } else if (destFile.endsWith('.gltf')) {
                destExt = '.gltf'
            } else {
                throw new Error(`Unsupported file extension: ${destFile}`)
            }

            const srcPath = fs.realpathSync(srcFile)
            const destDir = fs.realpathSync(path.dirname(destFile))
            const destPath = path.join(destDir, path.basename(destFile, destExt))

            const args = opts.slice(0)
            args.push('--input', srcPath, '--output', destPath)
            const child = childProcess.spawn(tool, args)

            let output = ''
            // eslint-disable-next-line no-return-assign
            child.stdout.on('data', (data) => output += data)
            // eslint-disable-next-line no-return-assign
            child.stderr.on('data', (data) => output += data)
            child.on('error', reject)
            child.on('close', code => {
                // the FBX SDK may create an .fbm dir during conversion; delete!
                const fbmCruft = srcPath.replace(/.fbx$/i, '.fbm')
                // don't stick a fork in things if this fails, just log a warning
                const onError = error =>
                    error && console.warn(`Failed to delete ${fbmCruft}: ${error}`)
                try {
                    fs.existsSync(fbmCruft) && rimraf(fbmCruft, {}, onError)
                } catch (error) {
                    onError(error)
                }

                // non-zero exit code is failure
                if (code !== 0) {
                    reject(new Error('Converter output:\n' +
                        (output.length ? output : '<none>')))
                } else {
                    resolve(destPath + destExt)
                }
            })
        } catch (error) {
            reject(error)
        }
    })
}

module.exports = convert
