import {HttpUtil} from '../../../library/js/utils/httpUtil';
import '../css/index.scss';
import '../component/layer.html';
import '../css/index.less';
import $ from 'jquery';
import Vue from 'vue';
import SlideBarrage from '../../../library/components/slideBarrage/sildeBarrage';
import '../css/base.css';
import Test from '../component/test';

function hello(){
  const time = new Date().getHours();
  const str = `now the time of hour is ${time}`;
  console.log('hello webpack-stream!');
  console.log(str);
}
hello();

const newUrl = HttpUtil.updateParam(window.location.url, 'goddancer', 123);
const name = HttpUtil.getParam('name');
console.log(name);
console.log($(document).height());

const mainVue = new Vue({
  el: '#app',
  data: {},
  components: {
    SlideBarrage,
    test: Test
  },
  methods: {
    show: function(str){
      console.log(str);
    }
  }
});