import {
    Loading,
    MessageBox,
    Message,
    Notification,
    Table,
    TableColumn,
    Dialog,
    Button,
    Form,
    FormItem,
    Input,
    Switch,
    Link,
    Card,
    Select,
    Option,
    Slider,
    ColorPicker,
    Tooltip,
    Icon,
    Row,
    Col,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Image,
    Tree
} from 'element-ui'

const components = [
    MessageBox,
    Message,
    Notification,
    Table,
    TableColumn,
    Dialog,
    Button,
    Form,
    FormItem,
    Input,
    Switch,
    Link,
    Card,
    Select,
    Option,
    Slider,
    ColorPicker,
    Tooltip,
    Icon,
    Row,
    Col,
    Dropdown,
    DropdownMenu,
    DropdownItem,
    Image,
    Tree
]

const install = (Vue, opts = {}) => {
    Vue.use(Loading.directive)
    components.forEach(component => Vue.component(component.name, component))
    Vue.prototype.$ELEMENT = {
        size: opts.size || '',
        zIndex: opts.zIndex || 2000
    }
    Vue.prototype.$msgbox = MessageBox
    Vue.prototype.$alert = MessageBox.alert
    Vue.prototype.$confirm = MessageBox.confirm
    Vue.prototype.$prompt = MessageBox.prompt
    Vue.prototype.$notify = Notification
    Vue.prototype.$message = Message
    Vue.prototype.$loading = Loading.service
}

export default {
    install
}
