import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
    {
        path: '/',
        name: 'Layout',
        component: () => import('@/views/Layout/Layout')
    },
    {
        path: '/lightList',
        name: 'LightList',
        component: () => import('@/views/LightList/LightList')
    },
    {
        path: '/materialList/:type',
        name: 'MaterialList',
        component: () => import('@/views/MaterialList/MaterialList'),
        props: true
    },
    {
        path: '/material/:meshNameRaw/:nameRaw',
        name: 'Material',
        component: () => import('@/views/Material/Material'),
        props: true
    },
    {
        path: '/performance',
        name: 'Performance',
        component: () => import('@/views/Performance/index')
    },
    {
        path: '/editor',
        name: 'Editer',
        component: () => import('@/views/Editor/index')
    },
    {
        path: '/scene',
        name: 'Scene',
        component: () => import('@/views/Scene/index')
    }
]

const router = new VueRouter({
    mode: 'hash',
    routes
})
window.router = router
export default router
