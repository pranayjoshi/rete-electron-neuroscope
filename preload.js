const { contextBridge } = require('electron');
const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin').default;
const VueRenderPlugin = require('rete-vue-render-plugin').default;

contextBridge.exposeInMainWorld('api', {
    Rete,
    ConnectionPlugin,
    VueRenderPlugin
});
