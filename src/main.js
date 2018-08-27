import '@babel/polyfill'
import Vue from 'vue'
import './plugins/vuetify'
import App from './App.vue'
import router from './router'
import store from './store'
import './registerServiceWorker'
import VueCodemirror from 'vue-codemirror'
import 'codemirror/lib/codemirror.css'
import VueResource from 'vue-resource'

Vue.config.productionTip = false
Vue.use(VueCodemirror)
Vue.use(VueResource)

new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')
