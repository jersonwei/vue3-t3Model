'use strict'

import { app, protocol, BrowserWindow, Menu, ipcMain } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import path from 'path'
// import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win
let light
let material
let materialList
let scene

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
    { scheme: 'app', privileges: { secure: true, standard: true, supportFetchAPI: true } }
])

    ;[
        'light-add',
        'light-delete',
        'lightColor-change',
        'light-reset',
        'light-update',
        'fog-update',
        'light-clear',
        'light-helper',
        'light-position',
        'close-position-helper',
        'get-mesh-detail',
        'material-update',
        'mesh-update',
        'material-delete',
        'mesh-delete',
        'shadow-set',
        'get-scene-nodes'
    ].forEach(token =>
        ipcMain.on(token, (event, arg) => win.webContents.send(token, arg))
    )

    ;[
        'mesh-detail',
        'scene-nodes'
    ].forEach(token =>
        ipcMain.handle(token, (event, arg) => material.webContents.send(token, arg))
    )

    ;[
        'props-list-update'
    ].forEach(token =>
        ipcMain.handle(token, (event, arg) => materialList && materialList.webContents.send(token, arg))
    )

/* ipcMain.handle('mesh-detail', (event, arg) =>
  material.webContents.send('mesh-detail', arg)
)
// 获取场景层级节点
ipcMain.handle('scene-nodes', (event, arg) =>
  material.webContents.send('scene-nodes', arg)
) */

ipcMain.on('db-click', (event, { meshName, name }) => {
    const currentURL = win.webContents.getURL()
    if (!material) {
        material = new BrowserWindow({
            width: 1000,
            height: 800,
            autoHideMenuBar: true,
            title: '属性配置器',
            parent: win,
            webPreferences: {
                // Use pluginOptions.nodeIntegration, leave this alone
                // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                preload: path.resolve(__dirname, 'child.js'),
                /*  preload: path.join(
                  app.getAppPath(),
                  `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                ), */
                enableRemoteModule: true,
                webSecurity: false
            }
        })
    }
    material.loadURL(`${currentURL}material/${encodeURIComponent(meshName)}/${encodeURIComponent(name)}`)
    material.show()
    material.on('closed', () => {
        if (material) {
            material.destroy()
            material = null
        }
    })
})

const menuTemplate = [
    {
        label: '项目',
        submenu: [
            {
                label: '导入项目',
                click: () => win.webContents.send('import-project')
            },
            {
                label: '导入配置',
                click: () => win.webContents.send('import-config')
            },
            {
                label: '导出配置',
                click: () => win.webContents.send('export')
            },
            {
                label: '导出贴图',
                click: () => win.webContents.send('export-image')
            },
            {
                label: '导出项目',
                click: () => win.webContents.send('export-project')
            }
        ]
    },
    {
        label: '模型',
        submenu: [
            {
                label: '模型列表',
                click: () => win.webContents.send('model-list')
            },
            {
                label: '导出gltf',
                click: () => win.webContents.send('exportGltf')
            },
            {
                label: 'FBX转glTF',
                click: () => win.webContents.send('FBX2glTF')
            },
            {
                label: 'FBX转glTF且压缩',
                click: () => win.webContents.send('FBX2glTF-D')
            }
        ]
    },
    {
        label: '场景',
        submenu: [
            {
                label: '天空盒',
                click: () => win.webContents.send('skybox')
            },
            {
                label: '天空球',
                click: () => win.webContents.send('skyball')
            },
            {
                label: '背景图',
                click: () => win.webContents.send('backgroud-image')
            },
            {
                label: '场景配置',
                click: () => {
                    // win.webContents.send('light-list')
                    const currentURL = win.webContents.getURL()
                    console.log(currentURL)
                    if (light) {
                        scene.destroy()
                    }
                    scene = new BrowserWindow({
                        width: 1024,
                        height: 768,
                        autoHideMenuBar: true,
                        title: '场景配置',
                        parent: win,
                        webPreferences: {
                            // Use pluginOptions.nodeIntegration, leave this alone
                            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                            preload: path.resolve(__dirname, 'child.js'),
                            // preload: path.join(
                            //   app.getAppPath(),
                            //   `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                            // ),
                            enableRemoteModule: true
                        }
                    })
                    scene.loadURL(`${currentURL}scene`)
                    scene.show()
                }
            }
        ]
    },
    {
        label: '光源',
        submenu: [
            {
                label: '列表',
                click: () => {
                    // win.webContents.send('light-list')
                    const currentURL = win.webContents.getURL()
                    console.log(currentURL)
                    if (light) {
                        light.destroy()
                    }
                    light = new BrowserWindow({
                        width: 1024,
                        height: 768,
                        autoHideMenuBar: true,
                        title: '光源列表',
                        parent: win,
                        webPreferences: {
                            // Use pluginOptions.nodeIntegration, leave this alone
                            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                            preload: path.resolve(__dirname, 'child.js'),
                            // preload: path.join(
                            //   app.getAppPath(),
                            //   `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                            // ),
                            enableRemoteModule: true
                        }
                    })
                    light.loadURL(`${currentURL}lightList`)
                    light.show()
                }
            }
        ]
    },
    {
        label: '属性',
        submenu: [
            {
                label: '模型属性列表',
                click: () => {
                    const currentURL = win.webContents.getURL()
                    if (materialList) {
                        materialList.destroy()
                    }
                    materialList = new BrowserWindow({
                        width: 1366,
                        height: 768,
                        autoHideMenuBar: true,
                        title: '模型属性列表',
                        parent: win,
                        webPreferences: {
                            // Use pluginOptions.nodeIntegration, leave this alone
                            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                            preload: path.resolve(__dirname, 'child.js'),
                            // preload: path.join(
                            //   app.getAppPath(),
                            //   `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                            // ),
                            enableRemoteModule: true
                        }
                    })
                    materialList.loadURL(`${currentURL}materialList/mesh`)
                    materialList.show()
                    materialList.on('closed', () => {
                        materialList.destroy()
                        materialList = null
                    })
                }
            },
            {
                label: '材质列表',
                click: () => {
                    const currentURL = win.webContents.getURL()
                    if (materialList) {
                        materialList.destroy()
                    }
                    materialList = new BrowserWindow({
                        width: 1366,
                        height: 768,
                        autoHideMenuBar: true,
                        title: '材质列表',
                        parent: win,
                        webPreferences: {
                            // Use pluginOptions.nodeIntegration, leave this alone
                            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                            preload: path.resolve(__dirname, 'child.js'),
                            // preload: path.join(
                            //   app.getAppPath(),
                            //   `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                            // ),
                            enableRemoteModule: true
                        }
                    })
                    materialList.loadURL(`${currentURL}materialList/material`)
                    materialList.show()
                    materialList.on('closed', () => {
                        materialList.destroy()
                        materialList = null
                    })
                }
            }
        ]
    },
    {
        label: '测试',
        submenu: [
            {
                label: '加载测试',
                click: () => {
                    const currentURL = win.webContents.getURL()
                    const performance = new BrowserWindow({
                        width: 1024,
                        height: 768,
                        autoHideMenuBar: true,
                        title: '加载测试',
                        parent: win,
                        webPreferences: {
                            // Use pluginOptions.nodeIntegration, leave this alone
                            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                            preload: path.resolve(__dirname, 'child.js'),
                            // preload: path.join(
                            //   app.getAppPath(),
                            //   `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                            // ),
                            enableRemoteModule: true
                        }
                    })
                    performance.loadURL(`${currentURL}performance`)
                    performance.show()
                }
            },
            {
                label: '模型编辑器',
                click: () => {
                    const currentURL = win.webContents.getURL()
                    const performance = new BrowserWindow({
                        width: 1024,
                        height: 768,
                        autoHideMenuBar: true,
                        title: '模型编辑器',
                        parent: win,
                        webPreferences: {
                            // Use pluginOptions.nodeIntegration, leave this alone
                            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
                            preload: path.resolve(__dirname, 'child.js'),
                            // preload: path.join(
                            //   app.getAppPath(),
                            //   `${isDevelopment ? '../public/js/' : '/js/'}child.js`
                            // ),
                            enableRemoteModule: true
                        }
                    })
                    performance.loadURL(`${currentURL}editor`)
                    performance.show()
                }
            }
        ]
    },
    {
        label: '帮助',
        submenu: [
            { label: '开发者工具', role: 'toggleDevTools' },
            { label: '刷新', role: 'reload' }
        ]
    }
]

function createWindow() {
    // Create the browser window.
    win = new BrowserWindow({
        width: 800,
        height: 600,
        title: '基于WEBGL的三维可视化引擎的可视化配置工具',
        webPreferences: {
            // Use pluginOptions.nodeIntegration, leave this alone
            // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
            preload: path.resolve(__dirname, 'preload.js'),
            // preload: path.join(
            //   app.getAppPath(),
            //   `${isDevelopment ? '../public/js/' : '/js/'}preload.js`
            // ),
            enableRemoteModule: true,
            webSecurity: false
        }
    })
    //= ==========自定义file:///协议的解析=======================
    protocol.interceptFileProtocol('file', (req, callback) => {
        const url = req.url.substring(8)
        callback(decodeURI(url))
    }, (error) => {
        if (error) {
            console.error('Failed to register protocol')
        }
    })
    win.maximize()
    const menu = Menu.buildFromTemplate(menuTemplate)
    Menu.setApplicationMenu(menu)

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        // Load the url of the dev server if in development mode
        win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        // Load the index.html when not in development
        win.loadURL('app://./index.html')
    }

    win.on('closed', () => {
        win = null
    })
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.

app.on('ready', async () => {
    if (isDevelopment && !process.env.IS_TEST) {
        // Install Vue Devtools
        try {
            // await installExtension(VUEJS_DEVTOOLS)
            /* await session.defaultSession.loadExtension(
              path.join(__dirname, 'vue-devtools')
            ) */
            createWindow()
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    } else {
        createWindow()
    }
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', data => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}
