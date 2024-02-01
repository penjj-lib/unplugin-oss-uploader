import { createApp } from 'vue'
import vite from './assets/vite.png'
import App from './App.vue'
import './index.css'

Object.defineProperty(globalThis, 'vite', { value: vite })

createApp(App).mount('#app')
