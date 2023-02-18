<template>
    <el-row :gutter="10">
        <template v-for="(item, key) in position">
            <el-col :span="24" :key="key">
                <el-slider v-model.number="position[key]" clearable size="mini" show-input @input="change" :step="step"
                    :min="min" :max="max"></el-slider>
            </el-col>
        </template>
    </el-row>
</template>

<script>
export default {
    props: {
        value: Array,
        step: {
            type: Number,
            default: 0.1
        },
        max: {
            type: Number,
            default: 2000
        },
        min: {
            type: Number,
            default: -2000
        }
    },
    watch: {
        value: {
            handler(newVal) {
                const [x = 0, y = 0, z = 0] = newVal || []
                this.position = [x, y, z]
            },
            immediate: true
        }
    },
    model: {
        prop: 'value',
        event: 'change'
    },
    data() {
        return {
            position: [0, 0, 0]
        }
    },
    methods: {
        change(val) {
            this.$emit('change', this.position)
        }
    }

}
</script>

<style lang="scss" scoped>

</style>
