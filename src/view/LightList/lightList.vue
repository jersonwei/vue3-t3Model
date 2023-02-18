<template>
    <div class="light-list">
        <div class="btn-group flex-row row-end">
            <el-button type="primary" @click="onAdd">新增光源</el-button>
            <el-button type="primary" @click="onHelper">{{
                helperOn? '关闭辅助对象': '打开辅助对象'
            }}</el-button>
            <el-button type="primary" @click="closePositonHelper">{{ '关闭定位辅助'}}</el-button>
            <el-button type="primary" @click="onClear">清空数据</el-button>
        </div>
        <div class="btn-group flex-row row-end">
            <el-button type="primary" @click="onShadow">{{ isOpenShadow? '关闭': '开启' }}阴影</el-button>
            <template v-if="isOpenShadow">
                <span class="label">阴影贴图类型：</span>
                <el-select v-model="shadowMapType" @change="changeShadwoMapType">
                    <el-option v-for="item in shadowMapOptions" :key="item.value" :value="item.value"
                        :label="item.label"></el-option>
                </el-select>
            </template>

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
import { getLightConfig } from '@/utils/func'
export default {
    methods: {
        onBtnClick({ event, row }) {
            const func = new Map([
                ['delete', this.onDelete],
                ['config', this.onConfig],
                ['copy', this.onCopy],
                ['position', this.onPosition]
            ])
            func.has(event) && func.get(event).call(this, row)
        },
        onAdd() {
            this.$set(this, 'dialog', {
                title: '新增光源',
                visible: true,
                width: '500px',
                submit: this.onSubmit
            })
        },
        onConfig(light) {
            this.$set(this, 'dialog', {
                title: '配置光源',
                visible: true,
                width: '500px',
                light,
                submit: this.onConfigSubmit
            })
        },
        onConfigSubmit() {
            this.$refs.light.validate().then(form => {
                const { ipcRenderer } = window
                ipcRenderer.send('light-update', form)
                const config = getLightConfig()
                const index = config.findIndex(cfg => cfg.name === form.name)
                config[index] = form
                this.tableData = config
                localStorage.setItem('lightConfig', JSON.stringify(config))
                this.dialog.visible = false
            })
        },
        onDelete({ name }) {
            this.$confirm(`确认删除光源【${name}】？`, '提示', {
                type: 'warning'
            }).then(() => {
                this.closePositonHelper()
                const { ipcRenderer } = window
                ipcRenderer.send('light-delete', name)
                const index = this.tableData.findIndex(row => row.name === name)
                if (index !== -1) {
                    this.tableData.splice(index, 1)
                }
            })
        },
        onHelper() {
            this.helperOn = !this.helperOn
            const { ipcRenderer } = window
            ipcRenderer.send('light-helper', this.helperOn)
            localStorage.setItem('helper', this.helperOn ? '1' : '0')
        },
        onClear() {
            this.$confirm('确认清空光源配置数据', '提示', { type: 'warning' }).then(
                () => {
                    const config = getLightConfig()
                    localStorage.removeItem('lightConfig')
                    this.tableData = getLightConfig()
                    const { ipcRenderer } = window
                    ipcRenderer.send('light-clear', config.slice(1))
                }
            )
        },
        onCancel() {
            this.dialog.visible = false
            const { light } = this.dialog
            if (light) {
                const { ipcRenderer } = window
                ipcRenderer.send('light-update', light)
            }
        },
        onSubmit() {
            this.$refs.light.validate().then(form => {
                const { ipcRenderer } = window
                ipcRenderer.send('light-add', form)
                const config = getLightConfig()
                config.push(form)
                this.tableData = config
                localStorage.setItem('lightConfig', JSON.stringify(config))
                this.dialog.visible = false
            })
        },
        // 关闭定位辅助
        closePositonHelper() {
            const { ipcRenderer } = window
            ipcRenderer.send('close-position-helper')
        },
        onPosition(light) {
            const { ipcRenderer, $electron } = window
            ipcRenderer.send('light-position', light)
            $electron.remote.getCurrentWindow().close()
        },
        onCopy(light) {
            light.name = light.name + '_copy'
            const { ipcRenderer } = window
            ipcRenderer.send('light-add', light)
            const config = getLightConfig()
            config.push(light)
            this.tableData = config
            localStorage.setItem('lightConfig', JSON.stringify(config))
            ipcRenderer.send('light-update', light)
        },
        // 阴影相关
        // 开启关闭阴影
        onShadow() {
            this.isOpenShadow = !this.isOpenShadow
            this.setShadow({ isOpenShadow: this.isOpenShadow })
        },
        // 改变阴影贴图类型
        changeShadwoMapType(value) {
            this.setShadow({ shadowMapType: value })
        },
        setShadow({ isOpenShadow, shadowMapType }) {
            const { ipcRenderer } = window
            ipcRenderer.send('shadow-set', { isOpenShadow, shadowMapType })
            localStorage.setItem('shadowConfig', JSON.stringify({
                isOpenShadow: this.isOpenShadow,
                shadowMapType: this.shadowMapType
            }))
        }
    },
    created() {
        this.tableData = getLightConfig()
        const helperOn = localStorage.getItem('helper')
        if (helperOn === undefined) {
            this.helperOn = true
        } else {
            this.helperOn = helperOn === '1'
        }
        const { ipcRenderer } = window
        ipcRenderer.send('light-helper', this.helperOn)
        // 设置阴影参数
        const shadowConfig = localStorage.getItem('shadowConfig')
        if (shadowConfig) {
            const { isOpenShadow, shadowMapType, lights } = JSON.parse(shadowConfig)
            this.isOpenShadow = isOpenShadow
            this.shadowMapType = shadowMapType
            this.shadowLightNames = lights
        }
    },
    components: { customTable, light: () => import('./Dialog/Light') },
    data() {
        return {
            helperOn: true,
            dialog: { submit: () => { } },
            tableHead: [
                { label: '光源名称', prop: 'name' },
                {
                    label: '光源类型',
                    formatter: ({ type }) => {
                        const map = new Map([
                            ['ambient', '环境光'],
                            ['point', '点光源'],
                            ['directional', '平行光'],
                            ['hemisphere', '半球光'],
                            ['spot', '聚光灯'],
                            ['rectarea', '平面光']
                        ])
                        return map.has(type) ? map.get(type) : ''
                    }
                },
                { label: '光源强度', prop: 'intensity' },
                {
                    label: '光源颜色',
                    html: ({ color }) => {
                        const div = `<div style="padding:3px"><div class="light--color" style="background:${color};"></div></div>`
                        return div
                    }
                },
                { label: '光源位置', prop: 'position' },
                {
                    label: '操作',
                    width: 120,
                    btns: ({ type, helper }) => {
                        const btns = [
                            { label: '配置', event: 'config' },
                            { label: '复制', event: 'copy' },
                            { label: '定位', event: 'position' },
                            /* { label: `辅助对象（${helper === false ? '开' : '关'}）`, event: 'helper' }, */
                            { label: '删除', event: 'delete', type: 'danger' }
                        ]
                        if (type === 'ambient') {
                            return btns.splice(0, 1)
                        }
                        return btns
                    }
                }
            ],
            tableData: [],
            // 阴影相关
            isOpenShadow: false,
            shadowMapType: 'PCFShadowMap',
            shadowMapOptions: [
                { value: 'PCFShadowMap', label: 'PCFShadowMap-性能较差但边缘更平滑(默认)' },
                { value: 'BasicShadowMap', label: 'BasicShadowMap-性能非常好但是质量很差' },
                { value: 'PCFSoftShadowMap', label: 'PCFSoftShadowMap-性能较差但边缘更柔和' },
                { value: 'VSMShadowMap', label: 'VSMShadowMap-性能差，约束多，但能够产生意想不到的效果' }
            ]
        }
    }
}
</script>

<style lang="scss" scoped>
.btn-group {
    margin-bottom: 20px;
}

.light-list {
    margin: 30px 20px;
}

.el-table /deep/ {
    .light--color {
        box-sizing: border-box;
        width: 20px;
        height: 20px;
        margin: 0 auto;
        border-radius: 50%;
        box-shadow: 0 0 6px 0 rgba(0, 0, 0, 0.3);
    }
}

.label {
    padding: 0 5px 0 20px;
}
</style>
