<template>
  <div id="barrage">
    <transition-group name="brg" tag="ul" @before-enter="beforeEnter" @enter="enter" @after-enter="afterEnter">
      <li class="clear" v-for="(item,index) in barrageData" :key="item" :data-z="index">
        <div class="p_head"><img :src="item.mark" :num="rand[Math.random()*3>>0]" alt=""/></div>
        <div class="p_text">{{item.message}}</div>
      </li>
    </transition-group>
  </div>
</template>

<script type="text/ecmascript-6">
  import Vue from 'vue';
  import $ from 'jquery';
  import {CommentService} from '../../js/service/CommentService';
  import {Set} from '../../js/utils/Set';

  export default {
    props: {
      barrageId:{
        type:String//弹幕接口数据id
      },
      barrageNum:{
        type:Number,//接口单次获取数量，默认20
        default:20
      },
      barrageType:{
        type:String,//接口数据类型，默认新闻news
        default:'news'
      },
      auto:{
        type:Boolean,
        default:false
      }
    },
    data(){
      return{
        rand:[0,1,2],//驱动实时渲染vue-transition队列的投机方法
        num:1,//弹幕获取页码
        barrageData:[],//弹幕队列
        slideEnd:false//弹幕是否结束
      }
    },
    name:'barrage',
    mounted(){
      if(this.auto){
        var that = this;
        var barrageService = new CommentService(this.barrageId,this.barrageNum,this.barrageType);
        var barrageSet = new Set('pid', 'dateline');
        barrageService.get(function (coms) {
          for (var item in  coms.data.content) {
            barrageSet.put(coms.data.content[item]);
          }
          if ((!coms.data.content) || barrageSet.size() < 20) {
            this.slideEnd = true;
          }
          that.barrageData = barrageSet.toArray();
        });
      }
    },
    methods:{
      moreSlide: function (n) {
        var the = this;
        var barrageService = new CommentService(this.barrageId,this.barrageNum,this.barrageType);
        var barrageSet = new Set('pid', 'dateline');
        barrageService.jumpTo(function (data) {
          var slideIndex = 0;
          the.barrageData=[];
          barrageSet.removeAll();
          for (var item in  data.data.content) {
            barrageSet.put(data.data.content[item]);
            slideIndex++;
          }
          if (!(data.data.content) || slideIndex < 20) {
            the.slideEnd = true;
          }
          the.barrageData = barrageSet.toArray().slice(0);
        },n);
      },
      emptySlide:function(show,p){/*暴露给父组件操控是否显示弹幕以及弹幕跳转的方法*/
        var page=p||this.num;
        this.barrageData=[];
        if(show){
          this.moreSlide(page);
          this.num=page;
        }
      },
      beforeEnter(el){
        var index=el.getAttribute('data-z');
        var windowWidth=$(window).width();
        var position=['1.25rem','3.05rem','4.85rem','6.65rem'];/*暂定 是否传参写入*/
        if(index%4==0){
          el.style.top=position[0];
        }else if(index%4==1){
          el.style.top=position[1];
        }else if(index%4==2){
          el.style.top=position[2];
        }else{
          el.style.top=position[3];
        }
        el.style.transitionDelay=`${2*index}s`;
        el.style.webkitTransform = `translateX(${1.1*windowWidth}px)`;
        el.style.transform = `translateX(${1.1*windowWidth}px)`;
        el.style.visibility='visible';
      },
      enter(el){
        this.$nextTick(function(){
          var windowWidth=$(window).width();
          var width=el.getBoundingClientRect().width;
          var headWidth=el.getElementsByTagName('div')[0].getBoundingClientRect().width;
          el.style.webkitTransform = `translateX(-${windowWidth+width+headWidth}px)`;
          el.style.transform = `translateX(-${windowWidth+width+headWidth}px)`;
        });
      },
      afterEnter(el){
        el.style.visibility='hidden';
        this.barrageData.shift();
        if(this.slideEnd==true){/*默认弹幕队列循环显示*/
          this.num=0;
          this.slideEnd=false;
        }
        if(this.barrageData.length==0){
          this.moreSlide(++this.num);
          console.log(this.slideEnd+'|'+this.num);
        }
      }
    }
  }
</script>