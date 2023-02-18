<template>
    <div class="nodes">
        <el-tree class="filter-tree" :data="nodesData" node-key="name" :props="defaultProps"
            :current-node-key="currentName" :expand-on-click-node="false" highlight-current @node-click="nodeClick"
            ref="tree">
            <span class="custom-tree-node" slot-scope="{ node, data }">
                <span v-if="data.type === 'DataObject'" class="disabled" @click.stop>
                    <i style="fontWeight: bolder">{{ node.label }}</i>
                </span>
                <span v-else>
                    [{{ data.type }}]
                    <i style="fontWeight: bolder">{{ node.label }}</i>
                </span>
                <!-- <span>
          <el-button type="text"
                     size="mini"
                     @click="() => append(data)">
            Append
          </el-button>
          <el-button type="text"
                     size="mini"
                     @click="() => remove(node, data)">
            Delete
          </el-button>
        </span> -->
            </span>
        </el-tree>
    </div>
</template>

<script>
const { ipcRenderer } = window
export default {
    methods: {
        activeByName(name) {
            this.$nextTick(() => {
                const node = this.$refs.tree.getNode(name)
                this.$refs.tree.setCurrentKey(name)
                if (node && node.parent) {
                    // 展开高亮的节点的父节点
                    this.expandParents(node.parent)
                    // 此处定时1秒是因为我们没有异步加载el-tree，所以为了能够后续获取到dom，不得不设置定时器。
                    setTimeout(() => {
                        // tree-box在父页面中
                        const dom = document.getElementsByClassName('tree-box')[0]
                        const dom1 = document.getElementsByClassName('el-tree-node is-current is-focusable')[0]
                        // 这里的104是一个大概位置
                        dom.scrollTop = dom1.offsetTop - 104
                    }, 600)
                }
            })
        },
        expandParents(node) {
            node.expanded = true
            if (node.parent) {
                this.expandParents(node.parent)
            }
        },
        nodeClick(data) {
            ipcRenderer.send('db-click', { meshName: data.name })
            // ipcRenderer.send('get-mesh-detail', data.name)
        }
    },
    data() {
        return {
            currentName: '',
            nodesData: [],
            defaultProps: {
                children: 'children',
                label: 'name'
            }
        }
    },
    props: { name: String },
    watch: {
        name(val) {
            this.activeByName(val)
        }
    },
    created() {
        ipcRenderer.send('get-scene-nodes')
        ipcRenderer.on('scene-nodes', (event, arg) => {
            this.nodesData = arg
            this.activeByName(this.name)
        })
    }
}
</script>

<style lang="scss" scoped>
.el-form {
    padding: 20px;
}

.disabled {
    cursor: not-allowed;
}
</style>
