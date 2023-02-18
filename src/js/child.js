const electron = require('electron')
const { ipcRenderer } = electron
const fs = require('fs')
const path = require('path')
window.$electron = electron
window.ipcRenderer = ipcRenderer
window.$fs = fs
window.$path = path
