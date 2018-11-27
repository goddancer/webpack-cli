<template>
  <div class="app">
    <img src="../assets/bg.jpeg"
         alt="">
    <div class="rotate"></div>
    <div class="tt border_top_1px">123123123</div>
  </div>
</template>

<script>
  export default {
    name: "app",
    data() {
      return {}
    },
    methods: {},
    mounted() {
      const a = ['123123123123123123123123123123123123123123123123123123', '123123123123123123123123123', '123123123123123123123123123', '123123123123123123123123123']
      /*eslint-disable-next-line*/
      console.log(a)
      const foo = () => (false)
      const reallyLongArg = () => (false)
      const omgSoManyParameters = () => (false)
      const IShouldRefactorThis = () => (false)
      const isThereSeriouslyAnotherOne = () => (false)
      foo(reallyLongArg(), omgSoManyParameters(), IShouldRefactorThis(), isThereSeriouslyAnotherOne());
    },
  }
</script>

<style lang="less" scoped>
  @import '~border-1px.less';

  .app {
    width: 100%;
    height: 100%;
    //background: url("../assets/bg.jpeg") no-repeat center top / 100% 100%;
    .rotate {
      width: 75px;
      height: 75px;
      background: #c0c;
      animation: rotate linear 1.5s infinite;
    }
    .tt {
      line-height: 75px;
      font-size: 50px; /*nor*/
    }
  }
</style>