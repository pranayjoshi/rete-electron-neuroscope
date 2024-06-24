const { contextBridge } = require('electron');
const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin');
const VueRenderPlugin = require('rete-vue-render-plugin');

contextBridge.exposeInMainWorld('api', {
  Rete: Rete.default || Rete,
  ConnectionPlugin,
  VueRenderPlugin
});
