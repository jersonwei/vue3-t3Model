<template>
    <div class="model-list" ref="modelList">
        <div class="btn-group flex-row row-end">
            <el-button type="primary" @click="filepathAdd">文件夹批量导入</el-button>
            <el-button type="primary" @click="onAdd">新增模型</el-button>
            <!-- <el-button type="primary" @click="onCopy">拷贝模型设置</el-button> -->
            <el-button type="primary" @click="onClear">清空数据</el-button>
        </div>
        <custom-table :data="tableData" :heads="tableHead" has-index @btn-click="onBtnClick"></custom-table>
        <el-dialog :visible.sync="dialog.visible" :title="dialog.title" :width="dialog.width || '50%'" append-to-body
            :close-on-click-modal="false">
            <el-form status-icon v-if="dialog.visible" ref="formRef" :model="form" :rules="rules" label-suffix="："
                label-width="100px">
                <el-form-item v-for="item in formItems" :label="item.label" :key="item.prop" :prop="item.prop">
                    <component :is="item.tag" v-bind="item" v-model="form[item.prop]"></component>
                </el-form-item>
                <el-form-item label="模型文件" prop="path">
                    <el-input v-model="form.path" disabled>
                        <template slot="append">
                            <el-button type="primary" @click="onBrower">浏览</el-button>
                        </template>
                    </el-input>
                </el-form-item>
            </el-form>
            <div slot="footer" class="dialog-footer">
                <el-button @click="dialog.visible = false">取 消</el-button>
                <el-button type="primary" @click="onSubmit">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import customTable from '@/components/table'
import { getConfig } from '@/utils/func'
export default {
    methods: {
        onBtnClick({ event, row }) {
            const func = new Map([['delete', this.onDelete]])
            func.has(event) && func.get(event).call(this, row)
        },
        /* onCopy () {}, */
        onClear() {
            this.$confirm('确认清空数据', '提示', {
                type: 'warning'
            }).then(() => {
                const { IndexedDBHelper } = window.WeBIM
                IndexedDBHelper.open(
                    () => {
                        IndexedDBHelper.clearModels(
                            () => {
                                this.tableData = []
                                localStorage.clear()
                                this.$message.success('模型已清空')
                                IndexedDBHelper.close()
                                this.$emit('need-reload')
                            },
                            () => {
                                this.$message.error('模型清空失败')
                                IndexedDBHelper.close()
                            }
                        )
                    },
                    () => {
                        console.error('indexedDB 打开失败')
                    }
                )
            })
        },
        onDelete({ key }) {
            this.$confirm(`确认删除【${key}】`, '提示', { type: 'warning' }).then(
                () => {
                    const { IndexedDBHelper } = window.WeBIM
                    IndexedDBHelper.open(
                        () => {
                            IndexedDBHelper.deleteModelByKey(
                                key,
                                () => {
                                    const dataConfigArray = getConfig()
                                    const index = dataConfigArray.findIndex(
                                        (config) => config.key === key
                                    )
                                    dataConfigArray.splice(index, 1)
                                    this.tableData = dataConfigArray
                                    localStorage.setItem(
                                        'config',
                                        JSON.stringify(dataConfigArray)
                                    )
                                    IndexedDBHelper.close()
                                    this.$message.success(`模型【${key}】删除成功`)
                                    this.$emit('need-reload')
                                },
                                () => {
                                    IndexedDBHelper.close()
                                    this.$message.error(`模型【${key}】删除失败`)
                                }
                            )
                        },
                        () => console.error('indexedDB 打开失败')
                    )
                }
            )
        },
        onModelAdd() {
            const { key, interaction, modelData, name, path, type } = this.form
            const dataConfigArray = getConfig()
            const hasKey = dataConfigArray.some((config) => config.key === key)
            const { IndexedDBHelper } = window.WeBIM
            if (hasKey) {
                IndexedDBHelper.open(() => {
                    IndexedDBHelper.updateModel(
                        key,
                        modelData,
                        () => {
                            this.$message.success(`模型【${key}】更新成功`)
                            IndexedDBHelper.close()
                            this.$emit('need-reload')
                        },
                        () => {
                            this.$message.error(`模型【${key}】更新失败`)
                            IndexedDBHelper.close()
                        }
                    )
                })
            } else {
                dataConfigArray.push({
                    key,
                    interaction,
                    name,
                    dataType: type.toLowerCase() === '.fbx' ? 'fbx' : 'gltf',
                    url: path,
                    active: true
                })
                this.tableData = dataConfigArray
                localStorage.setItem('config', JSON.stringify(dataConfigArray))

                IndexedDBHelper.open(
                    () => {
                        IndexedDBHelper.addModel(
                            key,
                            false,
                            modelData,
                            () => {
                                this.$message.success(`模型【${key}】新增成功`)
                                IndexedDBHelper.close()
                            },
                            () => {
                                this.$message.error(`模型【${key}】新增失败`)
                                IndexedDBHelper.close()
                            }
                        )
                    },
                    () => console.error('indexedDB 打开失败')
                )
            }
        },
        onSubmit() {
            this.$refs.formRef.validate().then(() => {
                this.onModelAdd()
                this.dialog.visible = false
            })
        },
        onBrower() {
            const { dialog } = window.$electron.remote
            dialog
                .showOpenDialog({
                    filters: [{ name: 'FBX', extensions: ['FBX', 'GLTF', 'GLB'] }],
                    options: { properties: 'openFile' }
                })
                .then(({ filePaths: [path] }) => {
                    if (!path) return
                    this.$set(this.form, 'path', path)
                    const fs = window.$fs
                    const $path = window.$path
                    const name = $path.basename(path)
                    const type = $path.extname(path)
                    this.form.name = name
                    this.form.type = type
                    try {
                        const buffer = fs.readFileSync(path)
                        this.$set(this.form, 'modelData', buffer.buffer)
                    } catch (e) {
                        console.error(e)
                    }
                })
        },
        onAdd() {
            this.$set(this, 'dialog', {
                title: '新增模型',
                visible: true,
                width: '35%'
            })
            this.form = { interaction: true }
        },
        // 文件夹批量导入
        filepathAdd() {
            const { dialog } = window.$electron.remote
            dialog
                .showOpenDialog({ properties: ['openDirectory'] })
                .then(({ filePaths }) => {
                    if (filePaths.length === 1) {
                        this.listingFile(filePaths[0])
                    }
                })
        },
        listingFile(dirpath) {
            const fs = window.$fs
            const path = window.$path
            const nameList = []
            const typeList = ['.fbx', '.gltf', '.glb']
            fs.readdir(dirpath, (err, file) => {
                if (err) {
                    return alert(err)
                }
                for (const item of file) {
                    const filePath = path.join(dirpath, item)
                    const stat = fs.statSync(filePath)
                    // console.log(stat)
                    if (stat.isFile()) {
                        const extname = path.extname(item).toLowerCase()
                        const name = path.basename(item)
                        if (typeList.includes(extname)) {
                            const buffer = fs.readFileSync(filePath)
                            if (nameList.includes(name)) {
                                this.$message.error(`模型名称【${name}】重复，请修改`)
                            } else {
                                nameList.push(name)
                                this.form = {
                                    key: name,
                                    name,
                                    interaction: true,
                                    modelData: buffer.buffer,
                                    path: filePath,
                                    type: extname
                                }
                                this.onModelAdd()
                            }
                        }
                    }
                }
            })
        }
    },
    components: { customTable },
    created() {
        this.tableData = getConfig()
    },
    mounted() {
        // 去除title tooltip
        const { modelList } = this.$refs
        modelList.removeAttribute('title')
    },
    data() {
        return {
            dialog: {},
            form: { interaction: true },
            rules: {
                key: [{ required: true, message: '请输入模型的唯一Key' }],
                path: [{ required: true, message: '请选择模型文件' }]
            },
            formItems: [
                {
                    label: '模型Key',
                    prop: 'key',
                    tag: 'el-input',
                    clearable: true,
                    placeholder: '请输入模型的唯一Key'
                },
                { label: '模型可交互', prop: 'interaction', tag: 'el-switch' }
            ],
            tableData: [],
            tableHead: [
                { label: 'key', prop: 'key' },
                { label: 'name', prop: 'name' },
                { label: 'dataType', prop: 'dataType' },
                {
                    label: '操作',
                    btns: [{ label: '删除', event: 'delete', type: 'danger' }]
                }
            ]
        }
    }
}
</script>

<style lang="scss" scoped>
.btn-group {
    margin-bottom: 20px;
}

.path {
    margin-right: 20px;
}
</style>
