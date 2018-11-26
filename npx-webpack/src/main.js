// import assign from 'zjc-object-assign'
// import "@babel/polyfill"
// import 'babel-polyfill';
import Vue from 'vue'
import './styles/reset.css'
import './styles/style.less'
import 'normalize.css'
import App from './components/app.vue'
import es6Promise from 'es6-promise'

// for android below 4.4.4
es6Promise.polyfill()

new Vue({
    el: 'app',
    data: {},
    components: {
        App
    },
    methods: {},
    render: h => h(App),
})