<template>
  <div id="test">
    <img src="../img/goddancer.png" alt="">
  </div>
</template>

<script type="text/ecmascript-6">
  export default {
    props: [],
    name: 'test'
  }
</script>

<style lang="scss" rel="stylesheet/scss">
  /*这里vue-scss.css开始*/
  #test{
    width: 100px;
    height: 300px;
    background: url("../img/bg.jpg") no-repeat center top / 100% 100%;
    img{
      display: block;
      width: 100px;
      height: 100px;
    }
  }
  /*这里vue-scss.css结束*/
</style>
