<template>
    <div>
        <div class="source" id="source"></div>
    </div>
</template>

<script>
// import { sceneConfig } from './model.config.js'
import { getSceneConfig, getLightConfig, setShadow, setFog } from '@/utils/func'
import ParamTooler from '@/core/tool/paramTooler'
export default {
    methods: {
        load3D() {
            const config = localStorage.getItem('config') || '[]'
            const dataConfigArray = JSON.parse(config)
            console.log('model load3D')
            // 创建实例对象
            const app = window.WeBIM.App.getInstance()
            // 创建3D场景——背景 - scene_3D
            const mainscene = app.createScene(
                'main_scene',
                'source',
                JSON.parse(getSceneConfig())
            )
            // 构建3D模型——数据
            const objectCol = app.createDataCollection(
                'defaultObjectCollection',
                dataConfigArray,
                false
            )
            mainscene.bindDataCollection(objectCol)
        },
        onDataRenderFinish() {
            const config = getLightConfig()

            const { App, ModuleType } = window.WeBIM
            const scene = App.getInstance().getScene()
            const manager = scene.managerCenter.getManager(ModuleType.Light)
            config.forEach(({ name, type }) => {
                if (type !== 'ambient') {
                    manager.createLightHelper(name)
                }
            })
            this.renderMaterialConfig()
        },
        renderMaterialConfig() {
            const scene = window.WeBIM.App.getInstance().getScene()
            // 处理阴影
            const shadowConfig = JSON.parse(localStorage.getItem('shadowConfig') || '{}')
            setShadow({ arg: shadowConfig })
            // 处理雾
            const sceneConfig = JSON.parse(localStorage.getItem('sceneConfig') || '{}')
            setFog({ arg: sceneConfig.fogConfig })
            // 处理灯光
            const mapSize = 1024 * 8
            const lightConfig = JSON.parse(localStorage.getItem('lightConfig') || '[]')
            lightConfig.forEach(({ type, name, radius, castShadow }) => {
                const light = scene.getObjectByProperty('name', name)
                if (type === 'directional') {
                    light.castShadow = castShadow
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
                } else if (type === 'point' || type === 'spot') {
                    light.castShadow = castShadow
                    light.shadow.camera.far = radius
                    light.shadow.mapSize.width = mapSize
                    light.shadow.mapSize.height = mapSize
                    light.shadow.updateMatrices(light)
                    light.shadow.camera.updateProjectionMatrix()
                }
            })

            // 处理mesh属性
            const meshConfigs = JSON.parse(
                localStorage.getItem('meshList') || '[]'
            )
            meshConfigs.forEach((item) => {
                const { name } = item
                const mesh = scene.scene.getObjectByName(name)
                if (mesh) {
                    const parseMesh = ParamTooler.copyMeshProps(mesh)
                    mesh.userData.orginParams = parseMesh
                    ParamTooler.setObjectValue(mesh, item)
                    mesh.updateMatrix()
                }
            })

            // 处理材质
            const materialConfigs = JSON.parse(
                localStorage.getItem('materialList') || '[]'
            )
            materialConfigs.forEach((config) => {
                const { meshName, name } = config
                const mesh = scene.scene.getObjectByName(meshName)
                if (mesh) {
                    const { material } = mesh
                    const _config = JSON.parse(JSON.stringify(config))
                    // 修改材质
                    const setMaterial = (originMaterial, params, index) => {
                        const { userData: { orginParams } } = originMaterial
                        if (!orginParams) {
                            originMaterial.userData.orginParams = originMaterial.clone()
                        }
                        const { type, name } = params
                        const newMaterial = ParamTooler.parseConfig(params, () => {
                            // 回调函数用于异步加载完图片后调用
                            originMaterial.needsUpdate = true
                            scene.needUpdate()
                        })
                        if (originMaterial.type === type) {
                            // 材质变更类型相同
                            originMaterial.setValues(newMaterial)
                            originMaterial.needsUpdate = true
                        } else {
                            // 材质变更类型不同
                            const newTypeMaterial = new window.THREE[type]()
                            newTypeMaterial.setValues(newMaterial)
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
                        const index = material.findIndex(m => m.name === name)
                        if (index === -1) return
                        setMaterial(material[index], _config, index)
                    } else {
                        setMaterial(material, _config)
                    }
                    scene.needUpdate()
                } else {
                    console.warn(`no found mesh:${meshName}`)
                }
            })
            scene.needUpdate()
        }
    },
    mounted() {
        this.load3D()
        const {
            EventControl,
            Event3D: { onDataRenderFinish }
        } = window.WeBIM

        EventControl.addEvent(onDataRenderFinish, this.onDataRenderFinish, 'model')
    },
    beforeDestroy() {
        const {
            EventControl,
            Event3D: { onDataRenderFinish }
        } = window.WeBIM

        EventControl.clearEvent(onDataRenderFinish, 'model')
    },
    data() {
        return {}
    }
}
</script>

<style lang="scss" scoped>
.source {
    position: absolute;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    top: 0;
    left: 0;
}
</style>
