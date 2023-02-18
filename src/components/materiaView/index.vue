<template>
    <div class="material-view">
        <el-dropdown trigger="click" @command="handleChoose">
            <span class="el-dropdown-link">
                <span class="mat-btn">当前材质：{{ materialType }}</span>
                <i class="el-icon-arrow-down el-icon--right"></i>
            </span>
            <el-dropdown-menu slot="dropdown">
                <el-dropdown-item v-for="(item, index) in list" :key="item.name" :command="index">{{
                    item.name
                }}</el-dropdown-item>
            </el-dropdown-menu>
        </el-dropdown>

        <div class="edit" v-for="(item, key) in material" :key="key">
            <ParamView v-if="!propsList.includes(key)" :label="key" :value="item" :pname="key" @change="changeItem" />
        </div>
    </div>
</template>

<script>
// import GameEvent from '@/core/event/index'
import ParamView from '@/components/paramView/index.vue'
import config from '@/core/config/material'

export default {
    data() {
        return {
            list: [],
            propsList: ['id', 'name', 'type', 'userData', '_userData']
        }
    },
    // props: ["materialType", "material"],
    components: {
        ParamView
    },
    props: {
        materialType: {
            type: String
        },
        material: {
            type: Object
        }
    },
    mounted() {
        this.list = config
    },
    methods: {
        handleChoose(n) {
            if (this.materialType !== this.list[n].name) {
                this.$emit('changeType', this.list[n].name)
            }
        },
        changeItem(pname, n) {
            this.$emit('changeItem', pname, n)
        }
    }
}
</script>

<style lang="scss" scoped>
@import "./index.scss";
</style>
