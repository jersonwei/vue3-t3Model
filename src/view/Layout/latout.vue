<template>
    <div id="model" v-loading.fullscreen.lock="isLoading" :element-loading-text="loadingText"
        element-loading-spinner="el-icon-loading" element-loading-background="rgba(0, 0, 0, 0.8)">
        <model></model>
        <el-dialog :visible.sync="dialog.visible" :title="dialog.title" :width="dialog.width || '50%'" destroy-on-close>
            <component :is="dialog.tag" v-bind="dialog" v-if="dialog.visible" @need-reload="onNeedReload"></component>
            <div slot="footer" class="dialog-footer">
                <el-button @click="onCancel">取 消</el-button>
                <el-button type="primary" @click="onSubmit">确定</el-button>
            </div>
        </el-dialog>
    </div>
</template>

<script>
import { model } from '@/mixins/model'
export default {
    methods: {
        onModelListShow() {
            this.$set(this, 'dialog', {
                title: '模型列表',
                tag: 'model-list',
                visible: true
            })
        },
        onNeedReload() {
            this.needReload = true
        },
        onCancel() {
            if (this.needReload) {
                this.onSubmit()
            }
            this.dialog.visible = false
        },
        onSubmit() {
            window.location.reload()
            this.needReload = false
        }
    },
    components: {
        model: () => import('@/components/model/model'),
        modelList: () => import('./Dialog/ModelList')
        /* lightList: () => import('./Dialog/LightList') */
    },
    mixins: [model.call(this)],
    mounted() {
        window.addEventListener('model-list', this.onModelListShow)
        window.addEventListener('light-list', this.onLightListShow)
    },
    beforeDestroy() {
        window.removeEventListener('model-list', this.onModelListShow)
        window.removeEventListener('light-list', this.onLightListShow)
    },
    data() {
        return {
            isLoading: false,
            loadingText: '',
            dialog: {}
        }
    }
}
</script>

<style lang="scss" scoped>
#model {
    position: relative;

    .source {
        height: 100vh;

        i.el-icon-loading {
            font-size: 32px;
        }
    }
}
</style>
