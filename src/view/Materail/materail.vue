<template>
    <el-row class="scene" :gutter="20">
        <el-col :span="7" class="item">
            <h3>场景层级</h3>
            <div class="inner tree-box">
                <SceneNodes :name="meshName" />
            </div>
        </el-col>
        <el-col :span="7" class="item">
            <h3>属性</h3>
            <div class="flex-row mesh-props">
                <div>名称：{{ meshData.name }}</div>
                <div>类型：{{ meshData.type }}</div>
                <el-button type="primary" class="reset" :disabled="!selectMaterialId"
                    @click="onMeshReset">重置</el-button>
            </div>
            <div class="inner">
                <MeshProps ref="mesh" :data="meshData" />
            </div>
        </el-col>
        <el-col :span="10" v-show="materialList.length" class="item material">
            <h3>材质</h3>
            <div class="flex-row">
                <el-select v-model="selectMaterialId" @change="change" clearable>
                    <el-option v-for="opt in item.options" :key="opt.value" v-bind="opt">
                        <template v-if="item.hasSlots">
                            <span style="float: left">{{ opt.label }}</span>
                            <span style="float: right; color: #ccc; font-size: 13px">{{
                                opt.value
                            }}</span>
                        </template>
                    </el-option>
                </el-select>
                <el-button type="primary" class="reset" :disabled="!selectMaterialId" @click="onReset">重置</el-button>
            </div>
            <div class="inner">
                <MaterialView :materialType="materialType" :material="material" @changeType="changeType"
                    @changeItem="changeItem" />
            </div>

            <!--  <el-scrollbar class="inner"
                    style="height: 100%;">

      </el-scrollbar> -->

        </el-col>
    </el-row>
</template>

<script>
// import GameEvent from '@/core/event/index'
import SceneNodes from '@/components/sceneNodes.vue'
import MeshProps from '@/components/mesh.vue'
import MaterialView from '@/components/materialView/index.vue'
import ParamTooler from '@/core/tool/paramTooler'
const { ipcRenderer, THREE } = window
export default {
    methods: {
        onMeshReset() {
            ipcRenderer.send('mesh-delete', {
                name: this.meshData.name
            })
            this.meshData = JSON.parse(JSON.stringify(this.originMesh))
        },
        onReset() {
            ipcRenderer.send('material-delete', {
                meshName: this.meshName,
                name: this.originMaterial.name
            })
            //  设置原始数据
            const { userData: { orginParams } } = this.originMaterial
            if (orginParams) {
                if (this.materialType !== orginParams.type) {
                    this.changeType(orginParams.type)
                }
                this.setMaterial(ParamTooler.copyMaterialParam(orginParams))
            }
        },
        setMaterial(material) {
            this.material = material
        },
        // 选中材质id
        change(choicedId) {
            const material = this.materialList.find(({ id }) => id === choicedId) || {}
            const { id, name, type, userData } = material
            this.originMaterial = {
                id,
                name,
                userData
            }
            this.materialType = type
            // 选择材质后 避免初始化数据带来的changeItem事件
            this.initFlag = true
            this.setMaterial(material)
        },
        // 修改材质类型
        changeType(materialType) {
            this.materialType = materialType
            const material = this.getMaterialDetail(materialType)
            this.setMaterial(material)
            // 选择材质后 避免初始化数据带来的changeItem事件
            this.initFlag = true
            this.setMaterialUpdate({})
        },
        // 修改材质的子选项
        changeItem(key, value) {
            // 选择材质后 避免初始化数据带来的changeItem事件
            if (this.timeout) clearTimeout(this.timeout)
            if (this.initFlag) {
                this.timeout = setTimeout(() => {
                    this.initFlag = false
                }, 66)
                return
            }
            this.material[key] = value
            this.setMaterialUpdate({ [key]: value })
        },
        // 设置材质更新
        setMaterialUpdate(obejct) {
            const { id, name } = this.originMaterial
            // debugger
            const config = {
                id,
                name,
                meshName: this.meshName,
                type: this.materialType,
                ...obejct
            }
            ipcRenderer.send('material-update', { name: this.meshName, params: config })
        },
        // 获取材质详细数据
        getMaterialDetail(type) {
            let material
            switch (type) {
                case 'MeshBasicMaterial':
                    material = new THREE.MeshBasicMaterial()
                    break
                case 'MeshNormalMaterial':
                    material = new THREE.MeshNormalMaterial()
                    break
                case 'MeshLambertMaterial':
                    material = new THREE.MeshLambertMaterial()
                    break
                case 'MeshPhongMaterial':
                    material = new THREE.MeshPhongMaterial()
                    break
                case 'MeshToonMaterial':
                    material = new THREE.MeshToonMaterial()
                    break
                case 'MeshStandardMaterial':
                    material = new THREE.MeshStandardMaterial()
                    break
            }
            return ParamTooler.copyMaterialParam(material)
        },
        // 监听材质详细数据
        onMaterialDetail(list) {
            this.materialList = list
            this.item.options = list.map(({ name, id }) => ({
                label: name,
                value: id
            }))
            const setId = (id) => {
                this.selectMaterialId = id
                this.change(id)
            }
            if (this.name && this.name !== 'undefined') {
                const { id } = this.materialList.find((material) => material.name === this.name) || {}
                setId(id)
            } else if (list.length === 1) {
                // 假如没有传入材质名称 且 materialList中只有一个值，直接显示此内容
                const { id } = list[0]
                setId(id)
            }
        },
        // 获取mesh相关数据
        getMeshDetail(meshName) {
            ipcRenderer.send('get-mesh-detail', meshName)
        }
    },
    props: { meshNameRaw: String, nameRaw: String },
    components: { MaterialView, SceneNodes, MeshProps },
    computed: {
        meshName() {
            return decodeURIComponent(this.meshNameRaw)
        },
        name() {
            return decodeURIComponent(this.nameRaw)
        }
    },
    data() {
        return {
            item: {
                label: '材质',
                prop: 'id',
                options: [],
                hasSlots: true
            },
            materialList: [],
            selectMaterialId: null,
            material: {},
            materialType: '',
            meshData: {}
        }
    },
    watch: {
        meshName(val) {
            this.getMeshDetail(this.meshName)
        }
    },
    created() {
        this.getMeshDetail(this.meshName)
        ipcRenderer.on('mesh-detail', (event, arg) => {
            const { mesh, originMesh, material } = arg
            console.log('mesh-detail', mesh, material)
            this.meshData = mesh
            this.originMesh = originMesh
            this.onMaterialDetail(material)
        })
    }
}
</script>

<style lang="scss" scoped>
.scene {
    box-sizing: border-box;
    padding-top: 10px;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .item {
        display: flex;
        flex-direction: column;
        height: 100%;

        h3 {
            height: 30px;
            line-height: 30px;
            font-size: 18px;
            font-weight: bolder;
        }

        .inner {
            flex: 1;
            overflow-y: auto;
        }
    }
}

.mesh-props {
    justify-content: space-between;
    font-size: 14px;
}

.material {
    .reset {
        float: right;
    }
}

.el-select {
    width: 500px;
}
</style>
