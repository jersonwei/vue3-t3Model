<template>
    <el-form ref="formRef" :model="form" :rules="rules" :label-width="labelWidth" label-suffix="：" status-icon>
        <el-form-item v-for="item in items" :key="item.prop" :label="item.label" :prop="item.prop">
            <template v-if="item.tag === 'el-select'">
                <el-select v-model="form[item.prop]" :disabled="item.disabled" clearable>
                    <el-option v-for="opt in item.options" :key="opt.value" v-bind="opt">
                        <template v-if="item.hasSlots">
                            <span style="float: left">{{ opt.label }}</span>
                            <span style="float: right; color: #ccc; font-size: 13px">{{
                                opt.value
                            }}</span>
                        </template>
                    </el-option>
                </el-select>
            </template>
            <template v-else>
                <div class="flex-row" style="min-height: 40px">
                    <component :is="item.tag" v-bind="item" v-model="form[item.prop]"
                        :style="{ flex: 1, marginRight: '10px' }"
                        @active-change="(hexColorStr) => onColorChnage(item.prop, hexColorStr)"></component>
                    <el-tooltip v-if="item.tooltip" effect="dark" :content="item.tooltip" placement="top-end">
                        <i class="el-icon-question help"></i>
                    </el-tooltip>
                </div>
            </template>
        </el-form-item>
    </el-form>
</template>

<script>
import position from '@/components/position'

export default {
    components: { position },
    methods: {
        onColorChnage(prop, hexColorStr) {
            this.$emit('active-change', { prop, form: { ...this.form, [prop]: hexColorStr } })
        },
        updateForm(form) {
            // const keys = Object.keys(form || {})
            this.$set(this, 'form', form)
        },
        validate() {
            return this.$refs.formRef.validate()
        }
    },
    model: { prop: 'value', event: 'change' },
    created() {
        this.updateForm(this.value)
    },
    watch: {
        value: {
            handler(newVal) {
                this.updateForm(newVal)
            },
            deep: true
        },
        form: {
            handler(newVal) {
                this.$emit('change', newVal)
            },
            deep: true
        }
    },
    props: {
        value: Object,
        items: Array,
        rules: Object,
        labelWidth: {
            type: String,
            default: '100px'
        }
    },
    data() {
        return {
            form: {}
        }
    }
}
</script>

<style lang="scss" scoped>
.el-select {
    width: 100%;
}
</style>
