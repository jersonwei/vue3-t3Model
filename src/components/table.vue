<template>
    <el-table ref="table" :stripe="stripe" v-loading="loading" class="table" :data="data" :height="maxHeight"
        @selection-change="onSelectionChange" style="width: 100%" :cell-style="cellStyle" :header-cell-style="cellStyle"
        :highlight-current-row="highlightCurrentRow" @cell-click="onCellClick" :show-header="showHeader"
        :span-method="spanMethod" :show-summary="showSummary" :sum-text="sumText" :summary-method="summaryMethod"
        element-loading-background="rgba(48, 169, 255, 0.2)" border>
        <el-table-column v-if="hasSelection" type="selection" width="60" :selectable="selectable"></el-table-column>
        <el-table-column v-if="hasIndex" type="index" label="序号" width="60" class="index"></el-table-column>
        <el-table-column v-for="head in heads" :key="head.label" :label="head.label" :fixed="head.fixed || false"
            :min-width="head.width" align="center" show-overflow-tooltip>
            <template slot-scope="scope">
                <template v-if="typeof head.tag === 'function' && head.tag(scope.row)">
                    <!-- <el-image fit="contain" :key="scope.row.value" :src="scope.row.value" lazy></el-image> -->
                    <img :src="scope.row.value" alt class="img" />
                </template>
                <template v-else-if="head.tag === 'el-image'">
                    <el-image class="img" fit="contain" :key="head.src(scope.row)" :src="head.src(scope.row)"
                        lazy></el-image>
                </template>
                <template v-else-if="typeof head.btns === 'function'">
                    <el-link :type="btn.type || 'primary'" v-for="btn in head.btns(scope.row)" :key="btn.label"
                        :disabled="btn.disabled" :underline="btn.underline !== false || false"
                        @click="$emit('btn-click', { event: btn.event, row: scope.row })">{{ btn.label }}</el-link>
                </template>
                <template v-else-if="head.html">
                    <div v-html="head.html(scope.row)"></div>
                </template>
                <template v-else-if="head.btns">
                    <el-link :type="btn.type || 'primary'" v-for="btn in head.btns" :key="btn.label"
                        :disabled="btn.disabled" @click.stop="
                            $emit('btn-click', { event: btn.event, row: scope.row })
                        ">{{ btn.label }}</el-link>
                </template>
                <!-- <template v-else-if="typeof head.hasSwitch==='function'&&head.hasSwitch(scope.row)">
          <custom-switch :eqt="scope.row" @change="e=>onSwitchChange(e,scope.row)"></custom-switch>
        </template> -->
                <template v-else>
                    <div :class="getClass(head.state, scope.row)">
                        {{
    head.formatter ? head.formatter(scope.row) : scope.row[head.prop]
                        }}
                    </div>
                </template>
            </template>
        </el-table-column>
    </el-table>
</template>

<script>
export default {
    name: 'custom-table',
    // components: { customSwitch: () => import('@/components/customSwitch') },
    props: {
        stripe: Boolean,
        type: String,
        heads: [Array, Object],
        data: Array,
        loading: Boolean,
        maxHeight: [String, Number],
        /*  cellStyle: Function, */
        hasIndex: Boolean,
        hasSelection: Boolean,
        highlightCurrentRow: Boolean,
        showHeader: { type: Boolean, default: true },
        spanMethod: Function,
        showSummary: Boolean,
        sumText: String,
        summaryMethod: Function,
        selectable: Function
    },
    methods: {
        cellStyle({ row, column, rowIndex, columnIndex }) {
            if (columnIndex === 0) {
                return { paddingLeft: '10px' }
            }
        },
        onSelectionChange(selection) {
            this.$emit('selection-change', selection)
        },
        onSwitchChange(val, row) {
            this.$emit('switch-change', { val, row })
        },
        onCellClick(row, column, cell, event) {
            this.$emit('cell-click', { row, column, cell, event })
        },
        getClass(func, row) {
            if (typeof func === 'function') {
                return func(row)
            }
            return ''
        }
    },
    data() {
        return {}
    }
}
</script>

<style lang="scss" scoped>
.img {
    margin: 10px;
    width: 400px;
    height: 300px;
}
</style>
