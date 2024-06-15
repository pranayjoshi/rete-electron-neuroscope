// const { Rete, ConnectionPlugin, VueRenderPlugin } = window.api;

// // const MyComponent = require('./components/MyComponent');
// // const numSocket = new Rete.Socket('Number');

// (async () => {
//     const container = document.querySelector('#rete');

//     // const components = [new MyComponent(numSocket)];

//     const editor = new Rete.NodeEditor('demo@0.1.0', container);
//     editor.use(ConnectionPlugin);
//     editor.use(VueRenderPlugin);

//     const engine = new Rete.Engine('demo@0.1.0');

//     // components.forEach(c => {
//     //     editor.register(c);
//     //     engine.register(c);
//     // });

//     editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
//         console.log('process');
//         await engine.abort();
//         await engine.process(editor.toJSON());
//     });

//     editor.view.resize();
//     editor.trigger('process');
// })();
// const { Rete, ConnectionPlugin, VueRenderPlugin } = window.api;

// console.log('Rete:', Rete); // Logging to verify import
// console.log('ConnectionPlugin:', ConnectionPlugin); // Logging to verify import
// console.log('VueRenderPlugin:', VueRenderPlugin); // Logging to verify import

// (async () => {
//     const container = document.querySelector('#rete');
//     const { NodeEditor } = Rete;
    
//     console.log(NodeEditor)
//     const editor = new NodeEditor('demo@0.1.0', container);
//     editor.use(ConnectionPlugin);
//     editor.use(VueRenderPlugin);

//     const engine = new Rete.Engine('demo@0.1.0');

//     editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
//         console.log('process');
//         await engine.abort();
//         await engine.process(editor.toJSON());
//     });

//     editor.view.resize();
//     editor.trigger('process');
// })();

const Rete = require('rete');
const ConnectionPlugin = require('rete-connection-plugin');
const VueRenderPlugin = require('rete-vue-render-plugin');

(async () => {
  const container = document.querySelector('#rete');
  const editor = new Rete.NodeEditor('demo@0.1.0', container);
  editor.use(ConnectionPlugin);
  editor.use(VueRenderPlugin);

  const engine = new Rete.Engine('demo@0.1.0');

  editor.on('process nodecreated noderemoved connectioncreated connectionremoved', async () => {
    console.log('process');
    await engine.abort();
    await engine.process(editor.toJSON());
  });

  editor.view.resize();
  editor.trigger('process');
})();