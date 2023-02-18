<template>
    <div class="light">
        <custom-form ref="formRef" label-width="100px" :items="formItems" v-model="data"
            @change="onChange"></custom-form>
    </div>
</template>

<script>
import customForm from '@/components/form'

export default {
    methods: {
        onChange(newVal) {
            if (!Object.keys(this.originData).length) return
            // 判断数值变化 只提交修改的值
            const copyData = JSON.parse(JSON.stringify(newVal))
            Object.keys(copyData).forEach(key => {
                const value = copyData[key]
                if (Array.isArray(value)) {
                    value.join(',') === this.originData[key].join(',') && delete copyData[key]
                } else {
                    value === this.originData[key] && delete copyData[key]
                }
            })
            // 储存上一次修改的信息
            this.setOriginData(newVal)
            if (Object.keys(copyData).length) {
                const { name, type } = this.originData
                const { ipcRenderer } = window
                ipcRenderer.send('mesh-update', {
                    name,
                    type,
                    ...copyData
                })
            }
        },
        setOriginData(data) {
            this.originData = JSON.parse(JSON.stringify(data))
        }
    },
    components: { customForm },
    props: { data: Object },
    watch: {
        data: {
            handler(val) {
                this.setOriginData(val)
            }
        }
    },

    computed: {
        formItems() {
            const items = [
                {
                    label: '可见性',
                    prop: 'visible',
                    tag: 'el-switch'
                },
                {
                    label: '渲染顺序',
                    prop: 'renderOrder',
                    tag: 'el-slider',
                    showInput: true,
                    step: 1,
                    min: 0,
                    max: 1000
                },
                {
                    label: '产生阴影',
                    prop: 'castShadow',
                    tag: 'el-switch'
                },
                {
                    label: '接受阴影',
                    prop: 'receiveShadow',
                    tag: 'el-switch'
                },
                { label: '位置', prop: 'position', tag: 'position' },
                { label: '缩放', prop: 'scale', tag: 'position', step: 0.01, min: -1000, max: 1000 },
                { label: '旋转', prop: 'rotation', tag: 'position', step: 0.01, min: -360, max: 360 }
            ].map((item) => {
                if (!item.tag) {
                    Object.assign(item, { tag: 'el-input' })
                }
                return item
            })
            return items
        }
    },
    data() {
        return {
            originData: {}
        }
    }
}
</script>

<style lang="scss" scoped>

</style>
