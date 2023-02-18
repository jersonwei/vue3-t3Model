<template>
    <div class="param-view">
        <component :is="aim" :label="label" :value="value" :pname="pname" @change="handleChange"></component>
        <!-- <NumberView :label="'高度'" :value="num" :pname="'height'" @change="handleChange"/>
      <ColorView :label="'颜色'" :value="num" :pname="'color'" @change="handleChange"/>
      <SwitchView :label="'显示'" :value="num" :pname="'visible'" @change="handleChange"/>
      <ImageView :label="'贴图'" :value="src" :pname="'color'" @change="handleChange"/> -->
    </div>
</template>

<script>
// import GameEvent from '@/core/event/index'
import ParamTooler from '@/core/tool/paramTooler'
import NumberView from './number/index.vue'
import ColorView from './color/index.vue'
import SwitchView from './switch/index.vue'
import ImageView from './image/index.vue'

export default {
    data() {
        return {}
    },
    props: ['label', 'value', 'pname'],
    components: {
        NumberView,
        ColorView,
        SwitchView,
        ImageView
    },
    computed: {
        aim() {
            const type = ParamTooler.getType(this.label)
            switch (type) {
                case ParamTooler.TYPE_SWITCH:
                    return 'SwitchView'
                case ParamTooler.TYPE_COLOR:
                    return 'ColorView'
                case ParamTooler.TYPE_IMAGE:
                    return 'ImageView'
                default:
                    return 'NumberView'
            }
        }
    },

    mounted() { },

    methods: {
        handleChange(pname, n) {
            //   console.log(pname, n);
            this.$emit('change', pname, n)
        }
    }
}
</script>
