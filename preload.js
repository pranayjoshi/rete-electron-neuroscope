const { contextBridge } = require('electron');
const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin');
const VueRenderPlugin = require('rete-vue-render-plugin');

console.log('Rete:', Rete); // Logging to verify import
console.log('ConnectionPlugin:', ConnectionPlugin); // Logging to verify import
console.log('VueRenderPlugin:', VueRenderPlugin); // Logging to verify import

contextBridge.exposeInMainWorld('api', {
    Rete: Rete.default || Rete,
    ConnectionPlugin: ConnectionPlugin.default || ConnectionPlugin,
    VueRenderPlugin: VueRenderPlugin.default || VueRenderPlugin
});
