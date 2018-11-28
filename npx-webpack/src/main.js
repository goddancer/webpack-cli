// import assign from 'zjc-object-assign'
// import "@babel/polyfill"
// import 'babel-polyfill';
import Vue from 'vue'
import './styles/reset.css'
import './styles/style.less'
import 'normalize.css'
import 'whatwg-fetch'
import App from './components/app.vue'
import es6Promise from 'es6-promise'

// for android below 4.4.4
es6Promise.polyfill()

if (process.env.NODE_ENV === 'development') {
  /*eslint-disable-next-line*/
  console.log('this is development env')
}

new Vue({
  el: 'app',
  components: {
    App,
  },
  data: {},
  methods: {},
  render: h => h(App),
})
