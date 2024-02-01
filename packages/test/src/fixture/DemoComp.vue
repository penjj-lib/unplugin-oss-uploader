<script setup>
import vite from './assets/vite.png?url'
</script>

<!-- eslint-disable-next-line vue/block-lang -->
<template>
  <img src="./assets/vite.png">
  <div>{{ vite }}</div>
</template>

<style>
.box1 {
  background: url('@/assets/webpack.png');
}
.box2 {
  background: url('https://example.com/imgs/webpack.png');
}
</style>
