import { Message, Loading } from 'element-ui'
import ParamTooler from '@/core/tool/paramTooler'
const fs = window.$fs
const path = window.$path
const { dialog } = window.$electron.remote

export const getConfig = () => {
    const config = localStorage.getItem('config') || '[]'
    return JSON.parse(config)
}

export const getLightConfig = () => {
    return JSON.parse(
        localStorage.getItem('lightConfig') ||
        JSON.stringify([
            {
                name: 'ambient_light',
                type: 'ambient',
                intensity: 1,
                color: '#ffffff',
                position: [0, 0, 0]
            }
        ])
    )
}

export const getSceneConfig = () => {
    let config = localStorage.getItem('sceneConfig')

    const lightConfig = getLightConfig()

    if (!config) {
        config = JSON.stringify({
            backgroundType: 'skybox',
            skyImgPath: '/3D/resource/img/day/',
            // backgroundUrl: '/3D/resource/img/白云背景.png',
            backgroundColor: 'rgb(225, 225, 225)',
            statsHelper: true,
            coordinateHelper: true,
            managerConfig: {
                selectionConfig: {
                    transparent: true,
                    opacity: 0.5,
                    color: '#43cfda'
                }
            },
            cameraConfig: [
                {
                    name: 'perspective_camera',
                    cameraType: 'perspective',
                    position: [500, 500, 500],
                    target: [0, 0, 0],
                    active: true,
                    far: 500000,
                    near: 0
                }
            ],
            interactionConfig: {
                rightMenu: true,
                orbitConfig: [
                    {
                        name: 'fristOrbit',
                        upAngle: 90,
                        downAngle: 0,
                        maxDistance: 600000,
                        minDistance: 0,
                        enableDamping: true
                    }
                ]
            }
        })
    }

    // 设置阴影配置
    const shadowConfig = JSON.parse(localStorage.getItem('shadowConfig') || '{}')

    const cfg = JSON.parse(config)
    Object.assign(cfg, { lightConfig, shadowConfig })
    config = JSON.stringify(cfg)

    localStorage.setItem('sceneConfig', config)

    return config
}

export function hideLight() {
    const scene = window.WeBIM.App.getInstance().getScene()
    const keys = scene.getDataCollection().getDataKeys()
    keys.forEach(key => {
        const group = scene.getDataCollection().getData(key)
        hideLights(group)
    })
}

function hideLights(model) {
    if (model.type === 'DataObject') {
        model.children.length && hideLights(model.children[0])
    } else if (model.type === 'Group') {
        model.children.forEach(child => hideLights(child))
    } else if (model.type === 'AmbientLight') {
        model.visible = false
    }
}

function createLightSprite(modelKeys, rules) {
    const { App, Commons } = window.WeBIM
    const { TextureLoader, SpriteMaterial, Sprite } = window.THREE
    const scene = App.getInstance().getScene()
    const col = scene.getDataCollection()
    const materialMap = new Map()
    modelKeys.forEach(key => {
        // 获取模型
        const model = col.getData(key)
        model.traverse(object3d => {
            if (object3d.type === 'Mesh') {
                const { name } = object3d
                rules.forEach(({ reg, img, scale = 1 }) => {
                    if (reg.test(name)) {
                        // 移除之前创建的精灵
                        const sp = scene.getObjectByProperty('name', `light_${name}`)
                        if (sp) {
                            scene.removeObject(sp)
                            const material = sp.material
                            material.dispose()
                        }
                        // ----------------

                        // 隐藏定位构件
                        object3d.visible = false
                        // 获取定位构件的中心点作为精灵的坐标
                        const position = Commons.getObjectWorldCenterPosition(object3d)
                        let material = null
                        if (!materialMap.has(img)) {
                            const map = new TextureLoader().load(img)
                            material = new SpriteMaterial({ map, color: 'white' })
                            materialMap.set(img, material)
                        } else {
                            material = materialMap.get(img)
                        }
                        const sprite = new Sprite(material)
                        sprite.position.copy(position)
                        sprite.name = `light_${name}`
                        sprite.scale.multiplyScalar(scale)
                        scene.addObject(sprite)
                    }
                })
            }
        })
    })
}

window.createLightSprite = createLightSprite

// 导入项目部分 ----------------------------- start ---------------------------------
const { IndexedDBHelper } = window.WeBIM
// 加载模型
const indexedDBAdd = ({ key, modelData }) => {
    return new Promise((resolve, reject) => {
        IndexedDBHelper.open(
            () => {
                IndexedDBHelper.addModel(
                    key,
                    false,
                    modelData,
                    () => {
                        Message.success(`模型【${key}】新增成功`)
                        IndexedDBHelper.close()
                        resolve()
                    },
                    (err) => {
                        Message.error(`模型【${key}】新增失败`)
                        IndexedDBHelper.close()
                        reject(err)
                    }
                )
            },
            (err) => {
                console.error('indexedDB 打开失败')
                reject(err)
            }
        )
    })
}

// 解析配置文件
const parseConfig = (configPath) => {
    const configBuffer = fs.readFileSync(configPath)
    const config = configBuffer.toString('utf8').replace('export const config =', '')
    let { sceneConfig, dataConfigArray, materialArray, meshArray = [] } = JSON.parse(config)
    const { lightConfig, shadowConfig, fogConfig } = sceneConfig
    console.log(sceneConfig, dataConfigArray, materialArray)
    // 处理贴图 将贴图的url 更改为配置文件同级目录下的images
    materialArray = materialArray.map((item) => {
        console.log(path.dirname(configPath))
        Object.keys(item).forEach((key) => {
            const el = item[key]
            if (ParamTooler.checkMap(key) && el.image) {
                item[key].image = el.image.replace('/3D', path.dirname(configPath))
            }
        })
        return item
    })
    // 处理天空盒相关图片
    const { backgroundType, backgroundUrl, skyImgPath } = sceneConfig
    if (backgroundType === 'skybox') {
        if (skyImgPath !== '/3D/resource/img/day/') {
            sceneConfig.skyImgPath = skyImgPath.replace('/3D', path.dirname(configPath))
        }
    } else {
        sceneConfig.backgroundUrl = backgroundUrl.replace('/3D', path.dirname(configPath))
    }
    localStorage.setItem('materialList', JSON.stringify(materialArray))
    localStorage.setItem('meshList', JSON.stringify(meshArray))
    localStorage.setItem('sceneConfig', JSON.stringify(sceneConfig))
    localStorage.setItem('sceneConfig', JSON.stringify(sceneConfig))
    // 设置灯光数据
    localStorage.setItem('lightConfig', JSON.stringify(lightConfig))
    localStorage.setItem('lightConfig', JSON.stringify(lightConfig))
    shadowConfig && localStorage.setItem('shadowConfig', JSON.stringify(shadowConfig))
    fogConfig && localStorage.setItem('fogConfig', JSON.stringify(fogConfig))
    return { sceneConfig, dataConfigArray, materialArray }
}

const listingFile = (dirPath) => {
    const loadingInstance = Loading.service({
        text: '加载项目中'
    })

    const _dataConfigArray = []
    let dataConfigArray
    // 先读取配置
    try {
        const configPath = path.join(dirPath, 'model.config.js')
        dataConfigArray = parseConfig(configPath).dataConfigArray
    } catch (e) {
        Message.error('配置文件读取错误')
    }
    const modelPath = path.join(dirPath, '/models')
    const typeList = ['.fbx', '.gltf', '.glb']
    fs.readdir(modelPath, async (err, fileList) => {
        if (err) {
            loadingInstance.close()
            return Message.error('模型文件读取失败')
        }
        // 后读取模型
        for (const item of fileList) {
            const filePath = path.join(modelPath, item)
            const stat = fs.statSync(filePath)
            // console.log(stat)
            if (stat.isFile()) {
                const extname = path.extname(item).toLowerCase()
                const name = path.basename(item)
                // 处理模型
                if (typeList.includes(extname)) {
                    // 检查模型是否在配置文件中 只加载配置文件中的模型
                    const findData = dataConfigArray.find(({ name }) => name === item)
                    if (findData) {
                        const buffer = fs.readFileSync(filePath)
                        const { key, interaction, name, dataType } = findData
                        const data = {
                            key,
                            interaction,
                            modelData: buffer.buffer
                        }
                        _dataConfigArray.push({
                            key,
                            interaction,
                            name,
                            dataType,
                            url: filePath,
                            active: true
                        })
                        await indexedDBAdd(data)
                    } else {
                        Message.error(`模型名称【${name}】不在配置文件中`)
                    }
                }
            }
        }
        localStorage.setItem('config', JSON.stringify(_dataConfigArray))
        loadingInstance.close()
        window.location.reload()
    })
}
export const importProject = () => {
    // 选择项目文件
    dialog
        .showOpenDialog({ properties: ['openDirectory'] })
        .then(({ filePaths }) => {
            if (filePaths.length === 1) {
                IndexedDBHelper.open(
                    () => {
                        IndexedDBHelper.clearModels(
                            () => {
                                localStorage.clear()
                                console.log('模型已清空')
                                IndexedDBHelper.close()
                                listingFile(filePaths[0])
                            },
                            () => {
                                console.log('模型清空失败')
                                IndexedDBHelper.close()
                            }
                        )
                    })
            }
        })
}
// 导入配置文件
export const importConfig = () => {
    // 选择项目文件
    dialog
        .showOpenDialog({ properties: ['openFile'], filters: [{ name: 'JS', extensions: ['js'] }] })
        .then(({ filePaths }) => {
            if (filePaths.length === 1) {
                parseConfig(filePaths[0])
                window.location.reload()
            }
        })
}

// 导入项目部分 ---------------------------- end ----------------------------------

export const debounce = (fn, delay = 1000) => {
    // 实现防抖函数的核心是使用setTimeout
    // time变量用于保存setTimeout返回的Id

    let time = null

    function _debounce() {
        // 如果time不为0，也就是说有定时器存在，将该定时器清除
        if (time !== null) {
            clearTimeout(time)
        }

        time = setTimeout(() => {
            fn()
        }, delay)
    }

    // 防抖函数会返回另一个函数，该函数才是真正被调用的函数
    return _debounce
}

// 设置场景阴影配置
export const setShadow = ({ arg }) => {
    const { App } = window.WeBIM
    const { isOpenShadow, shadowMapType } = arg
    const scene = App.getInstance().getScene()
    if (isOpenShadow !== undefined) {
        scene.renderer.shadowMap.enabled = isOpenShadow
        scene.scene.traverse((obj) => {
            if (obj.type === 'Mesh') {
                obj.castShadow = isOpenShadow
                obj.receiveShadow = isOpenShadow
            }
        })
    }
    if (shadowMapType) scene.renderer.shadowMap.type = window.THREE[shadowMapType]
    scene.needUpdate()
}
// 设置雾
export const setFog = ({ arg }) => {
    const { App } = window.WeBIM
    if (!arg) return
    const { fog, color, near, far, density } = arg
    const scene = App.getInstance().getScene()
    const THREE = window.THREE
    const Color = new THREE.Color(color)
    if (fog) {
        const params = fog === 'Fog' ? [Color, near, far] : [Color, density]
        scene.scene.fog = new window.THREE[fog](...params)
    } else {
        scene.scene.fog = null
    }
    scene.needUpdate()
}
