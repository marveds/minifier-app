// preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    ipcRenderer: {
        send: (channel, data) => ipcRenderer.send(channel, data),
        once: (channel, listener) => ipcRenderer.once(channel, listener),
        on: (channel, listener) => ipcRenderer.on(channel, listener),
        notify: (title, body) => {
            if (typeof Notification !== 'undefined') {
                new Notification(title, { body:body, icon: './app_icon.png' });
            } else {
                console.error('Notifications are not supported on this platform.');
            }
        }
    },
});