import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import ElementUI from './utils/element-ui.js'
import './styles/index.scss'

Vue.config.productionTip = false
Vue.use(ElementUI, { size: 'meduim' })

new Vue({
    router,
    store,
    render: h => h(App)
}).$mount('#app')
