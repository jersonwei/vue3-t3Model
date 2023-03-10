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
                    label: '????????????',
                    prop: 'type',
                    tag: 'el-select',
                    disabled: this.light !== undefined,
                    options: [
                        { label: '?????????', value: 'ambient', disabled: true },
                        { label: '?????????', value: 'point' },
                        { label: '?????????', value: 'directional' },
                        { label: '?????????', value: 'hemisphere' },
                        { label: '?????????', value: 'spot' },
                        { label: '?????????', value: 'rectarea', disabled: true }
                    ]
                },
                { label: '????????????', prop: 'name', disabled: true },
                {
                    label: '????????????',
                    prop: 'intensity',
                    tag: 'el-slider',
                    showInput: true,
                    min: 0,
                    max: 2,
                    step: 0.01
                },
                { label: '????????????', prop: 'color', tag: 'el-color-picker' }
            ].map((item) => {
                if (!item.tag) {
                    Object.assign(item, { tag: 'el-input', clearable: true })
                }
                return item
            })
            const shadowOptions = [
                {
                    label: '??????',
                    prop: 'castShadow',
                    tag: 'el-switch'
                },
                {
                    label: '????????????',
                    prop: 'radius',
                    tag: 'el-slider',
                    showInput: true,
                    step: 1,
                    min: 0,
                    max: 5000
                }
                /* {
                  label: '????????????',
                  prop: 'mapSize',
                  tag: 'el-slider',
                  step: 512,
                  min: 512,
                  max: 10240
                } */
            ]
            if (type) {
                type !== 'ambient' && items.push({ label: '????????????', prop: 'position', tag: 'position' })
                const map = new Map([
                    [
                        'directional', shadowOptions
                    ],
                    [
                        'point', [
                            ...[
                                {
                                    label: '??????',
                                    prop: 'distance',
                                    min: 0,
                                    max: 1000,
                                    tooltip:
                                        '?????????????????????????????????????????????0???????????? ????????????0???????????????????????????(???????????????)???????????? 0???'
                                },
                                {
                                    label: '?????????',
                                    prop: 'decay',
                                    min: 1,
                                    max: 10,
                                    tooltip: '?????????????????????????????????????????? 1???'
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
                                label: '????????????',
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
                                    label: '??????',
                                    prop: 'distance',
                                    min: 0,
                                    max: 1000,
                                    tooltip:
                                        '????????????????????????????????????????????????????????????????????????????????????????????????0??? ???????????? 0.0???'
                                },
                                {
                                    label: '????????????',
                                    prop: 'angle',
                                    min: 0,
                                    max: Math.PI / 2,
                                    step: 0.01,
                                    tooltip:
                                        '?????????????????????????????????????????????????????????????????????????????? Math.PI/2??????????????? Math.PI/3'
                                },
                                {
                                    label: '?????????????????????',
                                    prop: 'penumbra',
                                    min: 0,
                                    max: 1,
                                    step: 0.01,
                                    tooltip:
                                        '???????????????????????????????????????0???1??????????????? ????????? ??? 0.0???'
                                },
                                {
                                    label: '?????????',
                                    prop: 'decay',
                                    min: 1,
                                    max: 10,
                                    step: 0.01,
                                    tooltip: '????????????????????????????????????????????? 1???'
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
                type: [{ required: true, message: '?????????????????????' }]
            }
        }
    }
}
</script>

<style lang="scss" scoped>

</style>
