<template>
    <div class="switch-view">
        <div class="param">
            <div class="state">
                <my-label :label="label"></my-label>
                <div class="color" :class="{ active: value }" @click="handleChange">
                    <div class="bar"></div>
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
        return {}
    },
    props: ['label', 'value', 'pname'],
    components: { MyLabel },
    computed: {},

    mounted() { },

    methods: {
        handleChange(e) {
            this.$emit('change', this.pname, !this.value)
        }
    }
}
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
