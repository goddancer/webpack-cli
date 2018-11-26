<template>
    <div class="app">
        111
        <img src="../assets/bg.jpeg" alt="">
        <div class="rotate"></div>
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
            width: 50px;
            height: 50px;
            background: #c0c;
            animation: rotate linear 1.5s infinite;
        }
    }
</style>