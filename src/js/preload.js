import convert from '../utils/fbx2gltf'
const electron = require('electron')
const fs = require('fs')
const path = require('path')
// const convert = require('fbx2gltf')
/* const zlib = require('zlib')
const { createGzip } = zlib
const { pipeline } = require('stream') */

const { ipcRenderer, remote } = electron
Object.assign(window, {
    $electron: electron,
    $fs: fs, /* pipeline, createGzip */
    $path: path
})

ipcRenderer.on('href', (event, path) => {
    if (path) {
        window.router.push(path).catch(() => {
            console.log('路由错误')
        })
    }
})

ipcRenderer.on('model-list', () =>
    window.dispatchEvent(new Event('model-list'))
)

ipcRenderer.on('exportGltf', () => {
    const { GLTFExporter, App } = window.WeBIM
    const col = App.getInstance()
        .getScene()
        .getDataCollection()
    const keys = col.getActiveDataKeys()
    keys.forEach(key => {
        const exporter = new GLTFExporter()
        const model = col.getData(key)
        exporter.parse(model._groupRender.children[0], res => {
            if (res instanceof ArrayBuffer) {
                saveArrayBuffer(res, `${key}.glb`)
            } else {
                const output = JSON.stringify(res, null, 2)
                saveString(output, `${key}.gltf`)
            }
        }, { truncateDrawRange: false })
    })
})

const FBX2glTF = (options, type) => {
    // 选择项目文件
    remote.dialog
        .showOpenDialog({ properties: ['openFile', 'multiSelections'], filters: [{ name: 'FBX', extensions: ['fbx'] }] })
        .then(({ filePaths }) => {
            filePaths.forEach((item) => {
                const filePath = path.dirname(item)
                const extname = path.extname(item)
                const name = path.basename(item, extname)
                const output = path.join(filePath, name + `-${type}.glb`)
                convert(item, output, options).then(
                    destPath => {
                        remote.dialog.showMessageBox({
                            type: 'info', // 弹出框类型
                            title: '提示',
                            message: `${name}转换成功`
                        })
                    },
                    error => {
                        remote.dialog.showMessageBox({
                            type: 'error', // 弹出框类型
                            title: '提示',
                            message: `${name}转换失败`
                        })
                        console.log(error)
                    }
                )
            })
        })
}

ipcRenderer.on('FBX2glTF', () => {
    FBX2glTF(['--pbr-metallic-roughness'], '未压缩')
})

ipcRenderer.on('FBX2glTF-D', () => {
    FBX2glTF(['--pbr-metallic-roughness', '--draco'], '压缩')
})

// 设置天空盒
ipcRenderer.on('skybox', () => {
    // 选择天空盒文件
    setBackground('skybox')
})

const setBackground = (type) => {
    let Dialogoption = { properties: ['openFile'], filters: [{ name: 'jpg', extensions: ['jpg', 'jpeg', 'png'] }] }
    if (type === 'skybox') Dialogoption = { properties: ['openDirectory'] }
    const sceneConfig = JSON.parse(localStorage.getItem('sceneConfig') || '{}')
    remote.dialog
        .showOpenDialog(Dialogoption)
        .then(({ filePaths }) => {
            const { App } = window.WeBIM
            const scene = App.getInstance().getScene()
            if (filePaths.length === 1) {
                let url = filePaths[0]
                if (type === 'skybox') {
                    const { $fs: fs, $path: path } = window
                    const typeList = ['.png', '.jpg', '.jpeg']
                    const nameList = ['px', 'nx', 'py', 'ny', 'pz', 'nz']
                    const result = [null, null, null, null, null, null]
                    const dirpath = filePaths[0]
                    url = dirpath + '/'
                    const file = fs.readdirSync(dirpath)
                    if (!file) {
                        remote.dialog.showMessageBox({
                            type: 'info', // 弹出框类型
                            title: '提示',
                            message: '天空盒加载失败'
                        })
                        return
                    }
                    for (const item of file) {
                        const filePath = path.join(dirpath, item)
                        const stat = fs.statSync(filePath)
                        // console.log(stat)
                        if (stat.isFile()) {
                            const extname = path.extname(item).toLowerCase()
                            const name = path.basename(item, extname)
                            const index = nameList.indexOf(name)
                            if (typeList.includes(extname) && index !== -1) {
                                result.splice(index, 1, item)
                            }
                        }
                    }
                    const isNullArr = result.filter(subItem => !subItem)
                    if (isNullArr.length) {
                        remote.dialog.showMessageBox({
                            type: 'info', // 弹出框类型
                            title: '提示',
                            message: '天空盒图片不符合规格，必须以px,nx,py,ny,pz,nz命名'
                        })
                        return
                    }
                    // const cubeTexture = new window.THREE.CubeTextureLoader()
                    //   .setPath(dirpath + '/')
                    //   .load(result)
                    // cubeTexture.encoding = THREE.sRGBEncoding
                    // cubeTexture.needsUpdate = true
                    // const scene = WeBIM.App.getInstance().getScene()
                    // scene._scene.background = cubeTexture
                }
                sceneConfig.backgroundType = type
                if (type === 'skybox') {
                    sceneConfig.skyImgPath = url
                } else {
                    sceneConfig.backgroundUrl = url
                }
                localStorage.setItem('sceneConfig', JSON.stringify(sceneConfig))
                scene.setBackground(type, url)
                scene.needUpdate()
            }
        })
}

// 设置天空球
ipcRenderer.on('skyball', () => {
    // 选择天空球图片
    setBackground('skyball')
})

// 设置背景图
ipcRenderer.on('backgroud-image', () => {
    // 选择天空球图片
    setBackground('image')
})

ipcRenderer.on('export', () => window.dispatchEvent(new Event('export')))

ipcRenderer.on('import-project', () => window.dispatchEvent(new Event('import-project')))

ipcRenderer.on('import-config', () => window.dispatchEvent(new Event('import-config')))

ipcRenderer.on('export-image', () => window.dispatchEvent(new Event('export-image')))

ipcRenderer.on('export-project', () => window.dispatchEvent(new Event('export-project')))

ipcRenderer.on('light-list', () =>
    window.dispatchEvent(new Event('light-list'))
)

ipcRenderer.on('light-position', (event, arg) => {
    const e = new Event('light-position')
    e.arg = arg
    return window.dispatchEvent(e)
})

ipcRenderer.on('close-position-helper', () => window.dispatchEvent(new Event('close-position-helper')))

ipcRenderer.on('material-delete', (event, { meshName, name }) => {
    const { sender } = event
    const config = JSON.parse(localStorage.getItem('materialList') || '[]')
    const index = config.find(material => material.meshName === meshName)
    if (index !== -1) {
        config.splice(index, 1)
        localStorage.setItem('materialList', JSON.stringify(config))
    }
    const scene = window.WeBIM.App.getInstance().getScene()
    const mesh = scene.scene.getObjectByName(meshName)

    // if (Array.isArray(mesh.material)) {
    //   const index = mesh.material.findIndex(material => material.name === name)
    //   const { orginParams = false } = mesh.material[index].userData
    //   if (orginParams) {
    //     debugger
    //     orginParams.needsUpdate = true
    //     mesh.material[index] = orginParams
    //   }
    // } else {
    //   const { orginParams = false } = mesh.material.userData
    //   if (orginParams) {
    //     debugger
    //     Object.assign(mesh.material, orginParams)
    //     // mesh.material.setValues(orginParams)
    //     mesh.material.needsUpdate = true
    //   }
    // }
    // scene.needUpdate()
    const material = Array.isArray(mesh.material)
        ? mesh.material.find(material => material.name === name)
        : mesh.material
    const { orginParams = false } = material.userData
    if (orginParams) {
        Object.assign(material, orginParams)
        material.name = name
        material.needsUpdate = true
        scene.needUpdate()
        // 触发列表更新
        sender.invoke('props-list-update')
    }
})

ipcRenderer.on('mesh-delete', (event, arg) => {
    const e = new Event('mesh-delete')
    e.event = event
    e.arg = arg
    return window.dispatchEvent(e)
})

ipcRenderer.on('material-update', (event, arg) => {
    const e = new Event('material-update')
    e.event = event
    e.arg = arg
    return window.dispatchEvent(e)
})

ipcRenderer.on('mesh-update', (event, arg) => {
    const e = new Event('mesh-update')
    e.event = event
    e.arg = arg
    return window.dispatchEvent(e)
})

function save(blob, filename) {
    const link = document.createElement('a')
    link.style.display = 'none'
    document.body.appendChild(link)
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()

    // URL.revokeObjectURL( url ); breaks Firefox...
}

function saveString(text, filename) {
    save(new Blob([text], { type: 'text/plain' }), filename)
}

function saveArrayBuffer(buffer, filename) {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename)
}

ipcRenderer.on('get-mesh-detail', (event, arg) => {
    const e = new Event('get-mesh-detail')
    e.event = event
    e.arg = arg
    return window.dispatchEvent(e)
})

ipcRenderer.on('get-scene-nodes', (event, arg) => {
    const e = new Event('get-scene-nodes')
    e.event = event
    return window.dispatchEvent(e)
})

ipcRenderer.on('light-helper', (event, arg) => {
    const { App, ModuleType } = window.WeBIM
    const scene = App.getInstance().getScene()
    const manager = scene.managerCenter.getManager(ModuleType.Light)
    const list = manager.getLightNameList()
    list.forEach(name => {
        if (name !== 'ambient_light') {
            manager.setLightHelperVisible(name, arg)
        }
    })
})

ipcRenderer.on('light-clear', (event, arg) => {
    if (Array.isArray(arg)) {
        const { App, ModuleType } = window.WeBIM
        const scene = App.getInstance().getScene()
        const manager = scene.managerCenter.getManager(ModuleType.Light)
        arg.forEach(({ name }) => {
            manager.removeLightHelper(name)
            manager.removeLight(name)
        })
    }
})

ipcRenderer.on('light-update', (event, arg) => {
    const { App, ModuleType } = window.WeBIM
    const { name, type } = arg
    const scene = App.getInstance().getScene()
    const manager = scene.managerCenter.getManager(ModuleType.Light)
    const light = manager.getLight(name)
    const func = new Map([
        ['ambient', onAmbientLightUpdate],
        ['point', onPointLightUpdate],
        ['directional', onDirectionalLightUpdate],
        ['hemisphere', onHemisphereLightUpdate],
        ['spot', onSpotLightUpdate]
    ])
    func.has(type) && func.get(type).call(this, light, arg)
    scene.needUpdate()
})

ipcRenderer.on('light-delete', (event, arg) => {
    const { App, ModuleType } = window.WeBIM
    const scene = App.getInstance().getScene()
    const manager = scene.managerCenter.getManager(ModuleType.Light)
    manager.removeLightHelper(arg)
    manager.removeLight(arg)
    const config = JSON.parse(localStorage.getItem('lightConfig') || '[]')
    const index = config.findIndex(({ name }) => name === arg)
    if (index !== -1) {
        config.splice(index, 1)
        localStorage.setItem('lightConfig', JSON.stringify(config))
        const sceneConfig = JSON.parse(localStorage.getItem('sceneConfig') || '{}')
        sceneConfig.lightConfig = config
        localStorage.setItem('sceneConfig', JSON.stringify(sceneConfig))
    }
})

ipcRenderer.on('light-add', (event, arg) => {
    console.log('light-add', arg)
    const { App, ModuleType } = window.WeBIM
    const { type, name } = arg
    const scene = App.getInstance().getScene()
    const manager = scene.managerCenter.getManager(ModuleType.Light)
    const func = new Map([
        ['point', onPointLightAdd],
        ['directional', onDirectionalLightAdd],
        ['hemisphere', onHemisphereLightAdd],
        ['spot', onSpotLightAdd]
    ])

    const helper = localStorage.getItem('helper') === '1'

    if (func.has(type)) {
        const light = func.get(type).call(this, manager, arg)
        manager.addLight(light)
        manager.createLightHelper(name)
        manager.setLightHelperVisible(name, helper)
        scene.needUpdate()
    }
})

function onPointLightAdd(manager, arg) {
    const { name, color, intensity, distance, decay, position } = arg
    const { Vector3 } = window.THREE

    return manager.createPointLight(
        name,
        color,
        intensity,
        distance,
        decay,
        new Vector3().fromArray(position)
    )
}

function onDirectionalLightAdd(manager, arg) {
    const { name, color, intensity, position } = arg
    const { Vector3 } = window.THREE

    return manager.createDirectionalLight(
        name,
        color,
        intensity,
        new Vector3().fromArray(position)
    )
}

function onHemisphereLightAdd(manager, arg) {
    const { name, color, groundColor, intensity, position } = arg
    const { Vector3 } = window.THREE

    return manager.createHemisphereLight(
        name,
        color,
        groundColor,
        intensity,
        new Vector3().fromArray(position)
    )
}

function onSpotLightAdd(manager, arg) {
    const {
        name,
        target,
        color,
        intensity,
        distance,
        angle,
        penumbra,
        decay,
        position
    } = arg
    const { Vector3 } = window.THREE

    return manager.createSpotLight(
        name,
        target,
        color,
        intensity,
        distance,
        angle,
        penumbra,
        decay,
        new Vector3().fromArray(position)
    )
}

function onAmbientLightUpdate(light, arg) {
    const { color, intensity, position } = arg
    const { Color } = window.THREE

    Object.assign(light, { color: new Color(color), intensity })
    light.position.fromArray(position)
}

function onPointLightUpdate(light, arg) {
    const { color, intensity, position, distance, decay, castShadow, radius } = arg
    const { Color } = window.THREE

    Object.assign(light, { color: new Color(color), intensity, distance, decay, castShadow })
    light.shadow.camera.far = radius
    const mapSize = 1024 * 8
    light.shadow.mapSize.width = mapSize
    light.shadow.mapSize.height = mapSize
    light.shadow.updateMatrices(light)
    light.shadow.camera.updateProjectionMatrix()
    light.position.fromArray(position)
}

function onDirectionalLightUpdate(light, arg) {
    const { color, intensity, position, name, castShadow, radius } = arg
    const { App, ModuleType } = window.WeBIM
    const { Color } = window.THREE
    const scene = App.getInstance().getScene()
    const manager = scene.managerCenter.getManager(ModuleType.Light)
    Object.assign(light, { color: new Color(color), intensity, castShadow })
    light.position.fromArray(position)
    const mapSize = 1024 * 8
    light.shadow.mapSize.width = mapSize
    light.shadow.mapSize.height = mapSize
    light.shadow.camera.far = radius
    light.shadow.camera.left = -radius
    light.shadow.camera.right = radius
    light.shadow.camera.top = radius
    light.shadow.camera.bottom = -radius
    light.shadow.bias = -0.0005
    light.shadow.updateMatrices(light)
    light.shadow.camera.updateProjectionMatrix()
    manager.createLightHelper(name)
}

function onHemisphereLightUpdate(light, arg) {
    const { color, intensity, position, groundColor } = arg
    const { Color } = window.THREE

    Object.assign(light, {
        color: new Color(color),
        intensity,
        groundColor: new Color(groundColor)
    })
    light.position.fromArray(position)
}

function onSpotLightUpdate(light, arg) {
    const { name, color, intensity, position, distance, angle, penumbra, decay, castShadow, radius } = arg
    const { App, ModuleType } = window.WeBIM
    const { Color } = window.THREE
    const scene = App.getInstance().getScene()
    const manager = scene.managerCenter.getManager(ModuleType.Light)

    Object.assign(light, {
        color: new Color(color),
        intensity,
        distance,
        angle,
        penumbra,
        decay,
        castShadow
    })
    light.position.fromArray(position)
    light.shadow.camera.far = radius
    const mapSize = 1024 * 8
    light.shadow.mapSize.width = mapSize
    light.shadow.mapSize.height = mapSize
    light.shadow.updateMatrices(light)
    light.shadow.camera.updateProjectionMatrix()
    manager.createLightHelper(name)
}

ipcRenderer.on('shadow-set', (event, arg) => {
    const e = new Event('shadow-set')
    e.arg = arg
    return window.dispatchEvent(e)
})

ipcRenderer.on('fog-update', (event, arg) => {
    const e = new Event('fog-update')
    e.arg = arg
    return window.dispatchEvent(e)
})
