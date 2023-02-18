<template>
    <div class="image-view">
        <div class="param">
            <div class="state">
                <my-label :label="label"></my-label>
                <el-image v-if="value && value.image" :src="value.image" style="width: 30px; height: 30px"
                    :preview-src-list="[value.image]"></el-image>
                <div class="choose" @click="handleEdit"><i class="el-icon-picture-outline"></i> 修改</div>
                <div class="delete" @click="handleDelete"><i class="el-icon-delete"></i> 删除</div>
            </div>

            <NumberView v-if="value && value.repeatX" :label="'repeatX'" :value="value.repeatX" pname="repeatX"
                @change="handleChange" />
            <NumberView v-if="value && value.repeatY" :label="'repeatY'" :value="value.repeatY" pname="repeatY"
                @change="handleChange" />
        </div>
    </div>
</template>

<script>
// import GameEvent from '@/core/event/index'
import NumberView from '../number/index.vue'
import MyLabel from '../label'
console.log(window.$fs)
export default {
    data() {
        return {}
    },
    props: ['label', 'value', 'pname'],
    components: {
        NumberView, MyLabel
    },
    methods: {
        handleChange(name, data) {
            const _value = JSON.parse(JSON.stringify(this.value))
            if (Object.keys(_value).length === 0) {
                _value.repeatX = 1
                _value.repeatY = 1
            }
            _value[name] = data
            this.$emit('change', this.label, _value)
        },
        handleEdit() {
            const { dialog } = window.$electron.remote
            dialog
                .showOpenDialog({ properties: ['openFile'], filters: [{ name: 'image', extensions: ['jpg', 'png'] }] })
                .then(({ filePaths }) => {
                    if (filePaths.length === 1) {
                        this.handleChange('image', filePaths[0])
                    }
                })
        },
        handleDelete(e) {
            this.$emit('change', this.label, {})
        }
    }
}
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
