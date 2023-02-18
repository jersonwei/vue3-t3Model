import { getConfig, getLightConfig, getSceneConfig, hideLight, importConfig, importProject, setShadow, setFog } from '@/utils/func'
import { TransformControls } from '../../public/utils/TransformControls.js'
import ParamTooler from '@/core/tool/paramTooler'
const { dialog } = window.$electron.remote
const { $fs, $path } = window
export const model = () => ({
    methods: {
        onDataLoadProgress({ loaded, total }) {
            this.loadingText = `正在加载模型文件 ${((loaded * 100) / total).toFixed(
                2
            )}%`
        },
        onDataRenderFinish() {
            this.isLoading = false
            hideLight()
        },
        onObjectDBClick({ name }) {
            const { ipcRenderer } = window.$electron
            ipcRenderer.send('db-click', { meshName: name })
        },
        onExport() {
            dialog
                .showSaveDialog({
                    title: '保存配置文件',
                    defaultPath: 'model.config.js',
                    filters: [{ name: 'js', extensions: ['js'] }],
                    properties: ['showOverwriteConfirmation']
                })
                .then(({ cancel, filePath }) => {
                    if (!cancel) {
                        // console.log(getConfig())
                        this.exportConfig(filePath)
                    }
                })
        },
        exportConfig(filePath) {
            let materialConfig = JSON.parse(localStorage.getItem('materialList') || '[]')
            materialConfig = materialConfig.map((item) => {
                Object.keys(item).forEach((key) => {
                    const el = item[key]
                    if (ParamTooler.checkMap(key) && el.image) {
                        item[key].image = `/3D/images/${window.$path.basename(el.image)}`
                    }
                })
                return item
            })
            const materialArray = `"materialArray":${JSON.stringify(materialConfig)}`
            const meshArray = `"meshArray":${localStorage.getItem('meshList') || '[]'}`
            const dataConfigArray = `"dataConfigArray":${JSON.stringify(
                getConfig().map(config =>
                    Object.assign(config, { url: `/3D/models/${config.name}` })
                )
            )}`
            const _sceneConfig = JSON.parse(getSceneConfig())
            // 处理天空盒 天空球 背景图相关
            const { backgroundType, backgroundUrl, skyImgPath } = _sceneConfig
            const skyBasePath = '/3D/images/sky/'
            if (backgroundType === 'skybox') {
                if (skyImgPath !== '/3D/resource/img/day/') {
                    _sceneConfig.skyImgPath = skyBasePath
                }
            } else {
                _sceneConfig.backgroundUrl = `${skyBasePath}${window.$path.basename(backgroundUrl)}`
            }
            const sceneConfig = `"sceneConfig":${JSON.stringify(_sceneConfig)}`
            const config = `export const config = {${sceneConfig},${dataConfigArray},${materialArray}, ${meshArray}}`
            const fs = window.$fs
            const data = new Uint8Array(
                Buffer.from(config)
            )
            try {
                fs.writeFileSync(filePath, data)
                this.$message.success('配置文件导出成功！')
            } catch (e) {
                this.$message.error(e)
            }
        },
        onLightPosition({ arg }) {
            this.onClosePosition()
            const { App, ModuleType } = window.WeBIM
            const scene = App.getInstance().getScene()
            const manager = scene.managerCenter.getManager(ModuleType.Light)
            const camera = scene.getActiveCamera()
            this.control = new TransformControls(camera, scene.renderer.domElement)
            const light = scene._scene.getObjectByName(arg.name)
            const setPosition = () => {
                const { x, y, z } = light.position
                const config = getLightConfig()
                const index = config.findIndex(cfg => cfg.name === arg.name)
                const arr = [x, y, z].map(item => parseInt(item))
                config[index].position = arr
                localStorage.setItem('lightConfig', JSON.stringify(config))
                manager.createLightHelper(config[index].name)
                scene.needUpdate()
            }
            this.control.addEventListener('change', () => {
                // console.log(light.position)
                setPosition()
                scene.render()
            })
            // 控制镜头不移动
            this.control.addEventListener('dragging-changed', function (event) {
                // console.log(scene.interactionCenter, scene.interactionCenter.enabled, !event.value)
                scene.interactionCenter.getInteraction('Orbit')._enable = !event.value
            })
            // scene.interactionCenter.enabled = false
            // console.log(scene.interactionCenter)
            this.control.attach(light)
            scene._scene.add(this.control)
            scene.needUpdate()
        },
        onClosePosition() {
            if (this.control) {
                const { App } = window.WeBIM
                const scene = App.getInstance().getScene()
                this.control.dispose()
                scene._scene.remove(this.control)
                scene.needUpdate()
            }
        },
        // 监听材质更新
        onMaterialUpdate({ event, arg }) {
            const { sender } = event
            const { name, params } = arg
            const scene = window.WeBIM.App.getInstance().getScene()
            const mesh = scene.scene.getObjectByName(name)
            if (!mesh) return
            const { material } = mesh

            const materialList = JSON.parse(
                localStorage.getItem('materialList') || '[]'
            )
            const index = materialList.findIndex(
                material => material.meshName === name && material.name === params.name
            )

            // 只保存修改的修改的材质数据， 并非全部保存
            if (index === -1) {
                materialList.push(params)
            } else {
                // 判断类型差异
                if (materialList[index].type === params.type) {
                    Object.assign(materialList[index], params)
                } else {
                    materialList[index] = params
                }
            }
            localStorage.setItem('materialList', JSON.stringify(materialList))
            // 修改材质
            const setMaterial = (originMaterial, params, index) => {
                const { userData: { orginParams } } = originMaterial
                if (!orginParams) {
                    originMaterial.userData.orginParams = originMaterial
                }
                const { type, name } = params
                const newMaterial = ParamTooler.parseConfig(params, () => {
                    // 回调函数用于异步加载完图片后调用
                    originMaterial.needsUpdate = true
                    scene.needUpdate()
                })
                if (originMaterial.type === type) {
                    // 材质变更类型相同
                    Object.assign(originMaterial, newMaterial)
                    // originMaterial.setValues(newMaterial)
                    originMaterial.needsUpdate = true
                } else {
                    // 材质变更类型不同
                    const orginParams = originMaterial.userData.orginParams
                    const newTypeMaterial = new window.THREE[type]()
                    newTypeMaterial.name = name
                    newTypeMaterial.userData.orginParams = orginParams
                    newTypeMaterial.needsUpdate = true
                    if (typeof index === 'number') {
                        mesh.material[index] = newTypeMaterial
                    } else {
                        mesh.material = newTypeMaterial
                    }
                }
            }
            if (Array.isArray(material)) {
                const index = material.findIndex(m => m.name === arg.params.name)
                if (index === -1) return
                setMaterial(material[index], params, index)
            } else {
                setMaterial(material, params)
            }
            scene.needUpdate()
            // 触发列表更新
            sender.invoke('props-list-update')
        },
        // 监听获取材质详情
        onGetMaterialDetail({ event, arg }) {
            const { sender } = event
            const name = arg
            // console.log('get-mesh-detail', name)
            const scene = window.WeBIM.App.getInstance().getScene()
            const manager = scene.managerCenter.getManager(
                window.WeBIM.ModuleType.Selection
            )
            const mesh = scene.scene.getObjectByName(name)
            manager.clear()
            const parseMaterial = (material) => {
                const { id, name, type, userData } = material
                const _userData = { ...userData }
                if (!userData.orginParams) {
                    userData.orginParams = material.clone()
                }
                _userData.orginParams = userData.orginParams.toJSON()
                return {
                    id,
                    name,
                    type,
                    userData: _userData,
                    ...ParamTooler.copyMaterialParam(material)
                }
            }
            if (mesh) {
                // 处理mesh属性
                const parseMesh = ParamTooler.copyMeshProps(mesh)

                // 处理材质
                const { material } = mesh
                let list = []
                if (material) {
                    if (Array.isArray(material)) {
                        list = material.map(item => {
                            return parseMaterial(item)
                        })
                    } else {
                        list = [parseMaterial(material)]
                    }
                }
                console.log('选中模型', parseMesh)
                console.log('选中模型的材质', list)
                sender.invoke('mesh-detail', {
                    originMesh: mesh.userData.orginParams || JSON.parse(JSON.stringify(parseMesh)),
                    mesh: parseMesh,
                    material: list
                })
            } else {
                console.warn(`no found mesh:${name}`)
            }
        },
        // 导出贴图
        onExportImage() {
            // 选择项目文件
            dialog
                .showOpenDialog({
                    title: '导出贴图文件',
                    properties: ['openDirectory']
                })
                .then(({ cancel, filePaths }) => {
                    if (!cancel && filePaths.length === 1) {
                        // console.log(getConfig())
                        this.exportImage(filePaths[0])
                    }
                })
        },
        exportImage(filePath) {
            // 处理材质贴图
            const materialConfig = JSON.parse(localStorage.getItem('materialList') || '[]')
            // 贴图数组
            const imageMapList = []
            materialConfig.forEach((item) => {
                Object.keys(item).forEach((key) => {
                    const el = item[key]
                    if (ParamTooler.checkMap(key) && el.image) {
                        imageMapList.push(el.image)
                    }
                })
            })

            // 处理天空盒 天空球 背景图等
            const sceneConfig = JSON.parse(localStorage.getItem('sceneConfig') || '{}')
            const { backgroundType, backgroundUrl, skyImgPath } = sceneConfig
            const imageSkyList = []

            if (backgroundType === 'skybox') {
                if (skyImgPath !== '/3D/resource/img/day/') {
                    const skyList = ['px.jpg', 'nx.jpg', 'py.jpg', 'ny.jpg', 'pz.jpg', 'nz.jpg'].map(item => skyImgPath + item)
                    imageSkyList.push(...skyList)
                }
            } else {
                imageSkyList.push(backgroundUrl)
            }
            console.log(imageMapList, imageSkyList)
            if (imageMapList.length === 0 && imageSkyList.length === 0) {
                this.$message.warning('没有贴图需要导出')
                return
            }
            this.exportFileByList(filePath + '/images', imageMapList)
            this.exportFileByList(filePath + '/images/sky', imageSkyList)
            this.$message.success('贴图导出成功')
        },
        // 通过list数组导出图片
        exportFileByList(path, list) {
            $fs.mkdirSync(path)
            const copyFile = (srcPath, tarPath) => {
                const rs = $fs.createReadStream(srcPath)
                const ws = $fs.createWriteStream(tarPath)
                rs.pipe(ws)
                console.log(srcPath + '复制文件完成')
            }
            list.forEach((image) => {
                copyFile(image, `${path}/${$path.basename(image)}`)
            })
        },
        exportModel(filePath) {
            const config = JSON.parse(localStorage.getItem('config') || '[]')
            const list = []
            config.forEach((item) => {
                list.push(item.url)
            })
            console.log(list)
            if (list.length === 0) {
                this.$message.warning('没有模型需要导出')
                return
            }
            this.exportFileByList(filePath + '/models', list)
            this.$message.success('模型导出成功')
        },
        // 导出项目
        onExportProject() {
            dialog
                .showSaveDialog({
                    title: '导出项目文件',
                    defaultPath: '默认项目',
                    properties: ['showOverwriteConfirmation']
                })
                .then(({ cancel, filePath }) => {
                    if (!cancel) {
                        // 创建文件夹
                        $fs.mkdirSync(filePath)
                        this.exportConfig(filePath + '/model.config.js')
                        this.exportImage(filePath)
                        this.exportModel(filePath)
                    }
                })
        },
        onGetSceneNodes({ event }) {
            const { sender } = event
            const scene = window.WeBIM.App.getInstance().getScene()
            const modelArray = scene._scene.children.filter(item => item.type === 'DataObject')
            const excludesArr = ['render', 'pipeline', 'Root_Scene']
            const parse = (Arr) => {
                const childrenArr = []
                Arr.forEach(obj => {
                    const { children, name, uuid, type } = obj
                    const child = parse(children)
                    // 过滤一部分不用的节点
                    if (excludesArr.includes(name)) {
                        childrenArr.push(...child)
                    } else {
                        childrenArr.push({
                            name,
                            uuid,
                            children: child,
                            type
                        })
                    }
                })
                return childrenArr
            }
            const list = parse(modelArray)
            sender.invoke('scene-nodes', list)
        },
        onMeshUpdate({ event, arg }) {
            const { sender } = event
            const { name } = arg
            const scene = window.WeBIM.App.getInstance().getScene()
            const mesh = scene.scene.getObjectByName(name)
            if (mesh) {
                const meshList = JSON.parse(
                    localStorage.getItem('meshList') || '[]'
                )
                const index = meshList.findIndex(item => item.name === name)
                if (index === -1) {
                    meshList.push(arg)
                } else {
                    Object.assign(meshList[index], arg)
                }
                localStorage.setItem('meshList', JSON.stringify(meshList))
                const { userData } = mesh
                const parseMesh = ParamTooler.copyMeshProps(mesh)
                if (!userData.orginParams) mesh.userData.orginParams = parseMesh
                ParamTooler.setObjectValue(mesh, arg)
                mesh.updateMatrix()
                scene.needUpdate()
                // 触发列表更新
                sender.invoke('props-list-update')
            }
        },
        onMeshDelete({ event, arg }) {
            const { sender } = event
            const { name } = arg
            const config = JSON.parse(localStorage.getItem('meshList') || '[]')
            const index = config.find(item => item.name === name)
            if (index !== -1) {
                config.splice(index, 1)
                localStorage.setItem('meshList', JSON.stringify(config))
            }
            const scene = window.WeBIM.App.getInstance().getScene()
            const mesh = scene.scene.getObjectByName(name)
            if (mesh && mesh.userData.orginParams) {
                ParamTooler.setObjectValue(mesh, mesh.userData.orginParams)
                mesh.updateMatrix()
                scene.needUpdate()
                // 触发列表更新
                sender.invoke('props-list-update')
            }
        }
    },
    mounted() {
        const {
            EventControl,
            Event3D: { onDataLoadProgress, onDataRenderFinish, onObjectDBClick }
        } = window.WeBIM

        EventControl.addEvent(onDataLoadProgress, this.onDataLoadProgress, 'app')
        EventControl.addEvent(onDataRenderFinish, this.onDataRenderFinish, 'app')
        EventControl.addEvent(onObjectDBClick, this.onObjectDBClick, 'app')
        window.addEventListener('export', this.onExport)
        window.addEventListener('import-project', importProject)
        window.addEventListener('export-project', this.onExportProject)
        window.addEventListener('import-config', importConfig)
        window.addEventListener('export-image', this.onExportImage)
        window.addEventListener('light-position', this.onLightPosition)
        window.addEventListener('close-position-helper', this.onClosePosition)
        window.addEventListener('material-update', this.onMaterialUpdate)
        window.addEventListener('get-mesh-detail', this.onGetMaterialDetail)
        window.addEventListener('shadow-set', setShadow)
        window.addEventListener('fog-update', setFog)
        window.addEventListener('get-scene-nodes', this.onGetSceneNodes)
        window.addEventListener('mesh-update', this.onMeshUpdate)
        window.addEventListener('mesh-delete', this.onMeshDelete)
    },
    beforeDestroy() {
        const {
            EventControl,
            Event3D: { onDataLoadProgress, onDataRenderFinish, onObjectDBClick }
        } = window.WeBIM

        EventControl.clearEvent(onDataLoadProgress, 'app')
        EventControl.clearEvent(onDataRenderFinish, 'app')
        EventControl.clearEvent(onObjectDBClick, 'app')
        window.removeEventListener('export', this.onExport)
        window.removeEventListener('import-project', importProject)
        window.removeEventListener('export-project', this.onExportProject)
        window.removeEventListener('import-config', importConfig)
        window.removeEventListener('export-image', this.onExportImage)
        window.removeEventListener('light-position', this.onLightPosition)
        window.removeEventListener('close-position-helper', this.onClosePosition)
        window.removeEventListener('material-update', this.onMaterialUpdate)
        window.removeEventListener('get-mesh-detail', this.onGetMaterialDetail)
        window.removeEventListener('shadow-set', setShadow)
        window.removeEventListener('fog-update', setFog)
        window.removeEventListener('get-scene-nodes', this.onGetSceneNodes)
        window.removeEventListener('mesh-update', this.onMeshUpdate)
        window.removeEventListener('mesh-delete', this.onMeshDelete)
    },
    created() {
        const { length } = getConfig()
        this.isLoading = length > 0
    },
    data() {
        return {
            isLoading: false,
            loadingText: ''
        }
    }
})
