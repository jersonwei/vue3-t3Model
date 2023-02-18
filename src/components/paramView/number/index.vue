<template>
    <div class="number-view">
        <div class="param">
            <div class="state">
                <my-label :label="label"></my-label>
                <!-- <input type="number"
               class="value"
               v-bind:value="value"
               v-on:input="handleChange"
               :data-pname="pname" /> -->

                <div class="value block">
                    <!-- <input type="range"
               class="range"
               :min="min"
               :max="max"
               :step="step"
               v-bind:value="value"
               v-on:input="handleChange"
               :data-pname="pname" /> -->
                    <el-slider v-bind:value="value" class="range" :min="min" :max="max" :step="step"
                        @input="handleSlide" :data-pname="pname" show-input></el-slider>
                    <i class="el-icon-s-tools setting" @click="configVisible = !configVisible"></i>
                </div>

            </div>

            <div class="config" v-if="configVisible">
                <div class="row">
                    <div class="label">最小值:</div>
                    <input type="number" class="value" v-bind:value="min" v-on:input="handleSetting" data-pname="min" />
                </div>

                <div class="row">
                    <div class="label">最大值:</div>
                    <input type="number" class="value" v-bind:value="max" v-on:input="handleSetting" data-pname="max" />
                </div>

                <div class="row">
                    <div class="label">步长:</div>
                    <input type="number" class="value" v-bind:value="step" v-on:input="handleSetting"
                        data-pname="step" />
                </div>
            </div>
        </div>
    </div>
</template>

<script>
// import GameEvent from '@/core/event/index'
import MyLabel from '../label'
export default {
    data() {
        return {
            configVisible: false,
            min: 0,
            max: 2,
            step: 0.01,
            aaa: 1
        }
    },
    props: ['label', 'value', 'pname'],
    components: { MyLabel },

    mounted() { },

    methods: {
        handleChange(e) {
            // console.log(this.pname + " == " + e.target.value);
            this.$emit('change', this.pname, e.target.value)
        },
        handleSlide(n) {
            this.$emit('change', this.pname, n)
        },
        handleSetting(e) {
            const key = e.target.dataset.pname
            this[key] = Number(e.target.value)
        }
    }
}
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
