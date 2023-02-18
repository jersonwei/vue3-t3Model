<template>
    <div class="light">
        <custom-form ref="formRef" label-width="125px" :items="formItems" :rules="rules" v-model="form"
            @active-change="fogUpdate"></custom-form>
    </div>
</template>

<script>
import customForm from '@/components/form'

export default {
    methods: {
        fogUpdate({ form }) {
            const { ipcRenderer } = window
            ipcRenderer.send('fog-update', form)
            const sceneConfig = JSON.parse(localStorage.getItem('sceneConfig'))
            if (form.fog) {
                sceneConfig.fogConfig = form
            } else {
                sceneConfig.fogConfig = {}
            }
            localStorage.setItem('sceneConfig', JSON.stringify(sceneConfig))
        }
    },
    components: { customForm },
    watch: {
        form: {
            handler(newVal) {
                this.fogUpdate({ form: newVal })
            },
            deep: true
        },
        'form.fog'(newVal, oldVal) {
            if (newVal && oldVal !== undefined) {
                this.$nextTick(() => {
                    const map = new Map([
                        ['Fog', { color: '#FFF', near: 1, far: 1000 }],
                        ['FogExp2', { color: '#FFF', density: 0.00025 }]
                    ])
                    this.$set(this, 'form', {
                        fog: newVal || '',
                        ...(map.has(newVal) ? map.get(newVal) : {})
                    })
                })
            }
        }
    },
    computed: {
        formItems() {
            const { fog } = this.form
            const items = [
                {
                    label: '雾',
                    prop: 'fog',
                    tag: 'el-select',
                    options: [
                        { label: '无', value: '' },
                        { label: '线性雾', value: 'Fog' },
                        { label: '指数雾', value: 'FogExp2' }
                    ]
                }
            ].map((item) => {
                if (!item.tag) {
                    Object.assign(item, { tag: 'el-input', clearable: true })
                }
                return item
            })

            if (fog) {
                items.push({ label: '雾颜色', prop: 'color', tag: 'el-color-picker' })
                const map = new Map([
                    [
                        'Fog',
                        [
                            {
                                label: '最小距离',
                                prop: 'near',
                                min: 0,
                                max: 2000,
                                tooltip:
                                    '距离小于活动摄像机“near”个单位的物体将不会被雾所影响。'
                            },
                            {
                                label: '最大距离',
                                prop: 'far',
                                min: 1,
                                max: 10000,
                                tooltip: '距离大于活动摄像机“far”个单位的物体将不会被雾所影响。'
                            }
                        ].map((item) => {
                            Object.assign(item, {
                                tag: 'el-slider',
                                showInput: true,
                                step: 1
                            })
                            return item
                        })
                    ],
                    [
                        'FogExp2',
                        [
                            {
                                label: '密度',
                                prop: 'density',
                                min: 0.000001,
                                max: 1,
                                tooltip:
                                    '定义雾的密度将会增长多快。'
                            }
                        ].map((item) => {
                            Object.assign(item, {
                                tag: 'el-slider',
                                showInput: true,
                                step: 0.000001
                            })
                            return item
                        })
                    ]
                ])
                map.has(fog) && items.push(...map.get(fog))
            }
            return items
        }
    },
    data() {
        return {
            form: {},
            rules: {}
        }
    },
    created() {
        const sceneConfig = JSON.parse(localStorage.getItem('sceneConfig'))
        if (sceneConfig.fogConfig && sceneConfig.fogConfig.fog) {
            this.form = sceneConfig.fogConfig
        } else {
            this.form = { fog: '' }
        }
    }
}
</script>

<style lang="scss" scoped>
.el-form {
    padding: 20px;
}
</style>
