<template>
    <div class="light">
        <custom-form ref="formRef" label-width="125px" :items="formItems" :rules="rules" v-model="form"
            @active-change="onActiveChange"></custom-form>
    </div>
</template>

<script>
import customForm from '@/components/form'
import { getLightConfig } from '@/utils/func'

export default {
    methods: {
        getLightName(type) {
            const config = getLightConfig()
            const lights = config.filter((cfg) => cfg.type === type)
            if (!lights.length) {
                return `${type}_light`
            } else {
                const { name } = lights[lights.length - 1]
                return `${type}_light${(Number(name.replace(`${type}_light`, '')) + 1)
                    .toString()
                    .padStart(2, '0')}`
            }
        },
        validate() {
            return new Promise((resolve, reject) => {
                this.$refs.formRef
                    .validate()
                    .then(() => {
                        resolve(this.form)
                    })
                    .catch((e) => reject(e))
            })
        },
        onActiveChange({ form }) {
            const { ipcRenderer } = window
            ipcRenderer.send('light-update', form)
        }
    },
    components: { customForm },
    props: { light: Object },
    created() {
        if (this.light) {
            this.rules = {}
            const keys = Object.keys(this.light || {})
            keys.length && (this.form = {})
            keys.forEach(key => {
                if (Array.isArray(this.light[key])) {
                    const [x, y, z] = this.light[key]
                    this.$set(this.form, key, [x, y, z])
                } else {
                    this.$set(this.form, key, this.light[key])
                }
            })
        }
    },
    watch: {
        form: {
            handler(newVal) {
                const { ipcRenderer } = window
                this.light && ipcRenderer.send('light-update', newVal)
            },
            deep: true
        },
        'form.type'(newVal, oldVal) {
            if (newVal && newVal !== 'ambient' && !this.light) {
                this.$nextTick(() => {
                    const map = new Map([
                        ['directional', { castShadow: false, radius: 500 }],
                        ['point', { distance: 0, decay: 1, castShadow: false, radius: 500 }],
                        ['hemisphere', { groundColor: '#000000' }],
                        [
                            'spot',
                            { distance: 0, angle: Math.PI / 3, penumbra: 0, decay: 1, castShadow: false, radius: 500 }
                        ]
                    ])
                    this.$set(this, 'form', {
                        name: this.getLightName(newVal),
                        type: newVal,
                        color: '#ffffff',
                        intensity: 1,
                        position: [0, 100, 0],
                        ...(map.has(newVal) ? map.get(newVal) : {})
                    })
                })
            }
        }
    },
    computed: {
        formItems() {
            const { type } = this.form
            const items = [
                {
                    label: '光源类型',
                    prop: 'type',
                    tag: 'el-select',
                    disabled: this.light !== undefined,
                    options: [
                        { label: '环境光', value: 'ambient', disabled: true },
                        { label: '点光源', value: 'point' },
                        { label: '平行光', value: 'directional' },
                        { label: '半球光', value: 'hemisphere' },
                        { label: '聚光灯', value: 'spot' },
                        { label: '平面光', value: 'rectarea', disabled: true }
                    ]
                },
                { label: '光源名称', prop: 'name', disabled: true },
                {
                    label: '光源强度',
                    prop: 'intensity',
                    tag: 'el-slider',
                    showInput: true,
                    min: 0,
                    max: 2,
                    step: 0.01
                },
                { label: '光源颜色', prop: 'color', tag: 'el-color-picker' }
            ].map((item) => {
                if (!item.tag) {
                    Object.assign(item, { tag: 'el-input', clearable: true })
                }
                return item
            })
            const shadowOptions = [
                {
                    label: '阴影',
                    prop: 'castShadow',
                    tag: 'el-switch'
                },
                {
                    label: '阴影半径',
                    prop: 'radius',
                    tag: 'el-slider',
                    showInput: true,
                    step: 1,
                    min: 0,
                    max: 5000
                }
                /* {
                  label: '阴影质量',
                  prop: 'mapSize',
                  tag: 'el-slider',
                  step: 512,
                  min: 512,
                  max: 10240
                } */
            ]
            if (type) {
                type !== 'ambient' && items.push({ label: '光源位置', prop: 'position', tag: 'position' })
                const map = new Map([
                    [
                        'directional', shadowOptions
                    ],
                    [
                        'point', [
                            ...[
                                {
                                    label: '距离',
                                    prop: 'distance',
                                    min: 0,
                                    max: 1000,
                                    tooltip:
                                        '这个距离表示从光源到光照强度为0的位置。 当设置为0时，光永远不会消失(距离无穷大)。缺省值 0。'
                                },
                                {
                                    label: '衰减量',
                                    prop: 'decay',
                                    min: 1,
                                    max: 10,
                                    tooltip: '沿着光照距离的衰退量。缺省值 1。'
                                }
                            ].map((item) => {
                                Object.assign(item, {
                                    tag: 'el-slider',
                                    showInput: true,
                                    step: 0.01
                                })
                                return item
                            }),
                            ...shadowOptions
                        ]
                    ],
                    [
                        'hemisphere',
                        [
                            {
                                label: '地面颜色',
                                prop: 'groundColor',
                                tag: 'el-color-picker'
                            }
                        ]
                    ],
                    [
                        'spot',
                        [
                            ...[
                                {
                                    label: '距离',
                                    prop: 'distance',
                                    min: 0,
                                    max: 1000,
                                    tooltip:
                                        '如果非零，那么光强度将会从最大值当前灯光位置处按照距离线性衰减到0。 缺省值为 0.0。'
                                },
                                {
                                    label: '散射角度',
                                    prop: 'angle',
                                    min: 0,
                                    max: Math.PI / 2,
                                    step: 0.01,
                                    tooltip:
                                        '从聚光灯的位置以弧度表示聚光灯的最大范围。应该不超过 Math.PI/2。默认值为 Math.PI/3'
                                },
                                {
                                    label: '半影衰减百分比',
                                    prop: 'penumbra',
                                    min: 0,
                                    max: 1,
                                    step: 0.01,
                                    tooltip:
                                        '聚光锥的半影衰减百分比。在0和1之间的值。 默认值 — 0.0。'
                                },
                                {
                                    label: '衰减量',
                                    prop: 'decay',
                                    min: 1,
                                    max: 10,
                                    step: 0.01,
                                    tooltip: '沿着光照距离的衰减量，缺省值为 1。'
                                }
                            ].map((item) => {
                                Object.assign(item, {
                                    tag: 'el-slider',
                                    showInput: true,
                                    step: 0.01
                                })
                                return item
                            })
                        ],
                        ...shadowOptions
                    ]
                ])
                map.has(type) && items.push(...map.get(type))
            }
            return this.light ? items : items.slice(0, 2)
        }
    },
    data() {
        return {
            form: {},
            rules: {
                type: [{ required: true, message: '请选择光源类型' }]
            }
        }
    }
}
</script>

<style lang="scss" scoped>

</style>
