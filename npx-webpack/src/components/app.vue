<template>
    <div class="app">
        <img src="../assets/bg.jpeg" alt="">
        <div class="rotate"></div>
        <div class="tt">123123123</div>
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
        },
    }
</script>

<style lang="less" scoped>
    .app{
        width: 100%;
        height: 100%;
        background: url("../assets/bg.jpeg") no-repeat center top / 100% 100%;
        .rotate{
            width: 75px;
            height: 75px;
            background: #c0c;
            animation: rotate linear 1.5s infinite;
        }
        .tt{
            line-height: 75px;
            font-size: 50px;/*nor*/
            color: #fff;
        }
    }
</style>