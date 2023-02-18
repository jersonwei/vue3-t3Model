<template>
    <div class="material-list">
        <div class="btn-group flex-row row-end">
            <el-button type="primary" @click="onClear" class="clear">清空数据</el-button>
        </div>
        <custom-table :data="tableData" :heads="tableHead" has-index @btn-click="onBtnClick"></custom-table>
        <el-dialog :show-close="false" :visible.sync="dialog.visible" :title="dialog.title"
            :width="dialog.width || '50%'" append-to-body :close-on-click-modal="false">
            <light v-if="dialog.visible" v-bind="dialog" ref="light"></light>
            <div slot="footer" class="dialog-footer">
                <el-button @click="onCancel">取 消</el-button>
                <el-button type="primary" @click="dialog.submit">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import customTable from '@/components/table'
import { debounce } from '@/utils/func'

export default {
    methods: {
        onBtnClick({ event, row }) {
            const func = new Map([
                ['config', this.onConfig],
                ['delete', this.onDelete]
            ])
            func.has(event) && func.get(event).call(this, row)
        },
        onConfig({ meshName, name }) {
            const { ipcRenderer } = window
            if (this.type === 'material') {
                ipcRenderer.send('db-click', { meshName, name })
            } else {
                ipcRenderer.send('db-click', { meshName: name })
            }
        },
        onCancel() {
            this.dialog.visible = false
        },
        onDelete({ meshName, name }) {
            this.$confirm(`确认删除配置【${name}】`, '提示', {
                type: 'warning'
            }).then(() => {
                const { ipcRenderer } = window
                let params = { name }
                if (this.type === 'material') params = { meshName, name }
                ipcRenderer.send(`${this.type}-delete`, params)
                this.deleteOne(params)
            })

            // this.tableData = JSON.parse(localStorage.getItem('materialList') || '[]')
        },
        deleteOne({ meshName, name }) {
            let index = -1
            if (this.type === 'material') {
                index = this.tableData.findIndex(
                    item => item.meshName === meshName && item.name === name
                )
            } else {
                index = this.tableData.findIndex(
                    item => item.name === name
                )
            }
            if (index !== -1) {
                this.tableData.splice(index, 1)
            }
        },
        onClear() {
            this.$confirm('确认清空配置数据', '提示', { type: 'warning' }).then(
                () => {
                    const { ipcRenderer } = window
                    this.tableData.forEach(({ meshName, name }) =>
                        ipcRenderer.send(`${this.type}-delete`, { meshName, name })
                    )
                    this.tableData = []
                }
            )
        },
        updated() {
            return debounce((params) => {
                this.tableData = JSON.parse(
                    localStorage.getItem(`${this.type}List`) || '[]'
                )
            }, 600)
        }
    },
    components: { customTable },
    props: { type: String },
    computed: {
        tableHead() {
            let list = []

            if (this.type === 'material') {
                list = [
                    { label: '网格名称', prop: 'meshName' },
                    { label: '材质名称', prop: 'name' },
                    { label: '材质类型', prop: 'type', width: 50 },
                    {
                        label: '透明',
                        width: 30,
                        formatter: ({ transparent }) => (transparent ? '开启' : '关闭')
                    },
                    { label: '不透明度', prop: 'opacity', width: 30 },
                    {
                        label: '颜色',
                        width: 40,
                        html: ({ color }) => {
                            const div = `<div style="padding:3px"><div class="color" style="background:${color};"></div></div>`
                            return div
                        }
                    }
                    /*  {
                      label: '放射（光）颜色',
                      width: 80,
                      html: ({ emissive }) => {
                        const div = `<div style="padding:3px"><div class="color" style="background:${emissive};"></div></div>`
                        return div
                      }
                    },
                    { label: '放射光强度', prop: 'emissiveIntensity' },
                    {
                      label: '高光颜色',
                      width: 50,
                      html: ({ specular }) => {
                        const div = `<div style="padding:3px"><div class="color" style="background:${specular};"></div></div>`
                        return div
                      }
                    },
                    { label: '高光程度', prop: 'shininess' }, */
                ]
            } else {
                list = [
                    { label: '网格名称', prop: 'name' }
                ]
            }
            return [

                ...list,
                {
                    label: '操作',
                    width: 40,
                    btns: [
                        { label: '配置', event: 'config' },
                        { label: '删除', event: 'delete', type: 'danger' }
                    ]
                }
            ]
        }
    },
    data() {
        return {
            tableData: [],
            dialog: { submit: () => { } }
        }
    },
    created() {
        this.tableData = JSON.parse(localStorage.getItem(`${this.type}List`) || '[]')
        const { ipcRenderer } = window
        ipcRenderer.on('props-list-update',
            (event, arg) => this.updated()
        )
    }
}
</script>

<style lang="scss" scoped>
.material-list /deep/ {
    margin: 30px 20px;

    .clear {
        margin-bottom: 20px;
    }

    .color {
        box-sizing: border-box;
        width: 20px;
        height: 20px;
        margin: 0 auto;
        border-radius: 50%;
        box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.3);
    }
}
</style>
