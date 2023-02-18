// 解析label
<template>
    <el-tooltip :content="label" placement="top">
        <div class="label">{{ label | parseCN}}:</div>
    </el-tooltip>
</template>

<script>
import CN from './string'
export default {
    name: 'MyLabel',
    props: {
        label: {
            type: String
        }
    },
    filters: {
        parseCN: (value) => {
            return CN[value] || value
        }
    }
}
</script>

<style lang="scss" scoped>
.label {
    width: 130px;
    text-align: left;
    font-size: 16px;
    color: #808080;
}
</style>
