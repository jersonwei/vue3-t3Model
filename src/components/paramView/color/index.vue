<template>
    <div class="color-view">
        <div class="param">
            <div class="state">
                <my-label :label="label"></my-label>
                <input type="color" class="value" v-bind:value="color" v-on:input="handleChange" :data-pname="pname" />
            </div>
        </div>
    </div>
</template>

<script>
// import GameEvent from '@/core/event/index'
import MyLabel from '../label'
import ColorTooler from '@/core/tool/colorTooler'

export default {
    data() {
        return {
            configVisible: false,
            min: 0,
            max: 10,
            step: 1
        }
    },
    props: ['label', 'value', 'pname'],
    components: { MyLabel },
    computed: {
        color() {
            if (!this.value) {
                return '#ffffff'
            }
            let data
            if (typeof this.value === 'string') {
                data = this.value.replace('0x', '#')
            } else if (typeof this.value === 'object') {
                const r = this.value.r * 255
                const g = this.value.g * 255
                const b = this.value.b * 255
                data = '#' + ColorTooler.RGBtoHex(r, g, b)
            }
            // let data = "#" + this.value.toString(16);
            console.log('color ==== ', this.value, typeof this.value, data)
            return data
        }
    },
    watch: {
        value: {
            handler(newValue, oldValue) {
                console.log(newValue, oldValue)
            }
        }
    },

    mounted() { },

    methods: {
        handleChange(e) {
            // console.log(e.target.value);
            // let key = e.target.dataset.pname;
            // console.log(key);
            // console.log(e.target.dataset);
            const data = e.target.value
            this.$emit('change', this.pname, data)
        },
        handleSetting(e) {
            const key = e.target.dataset.pname
            this[key] = e.target.value
        }
    }
}
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
