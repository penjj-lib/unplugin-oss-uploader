<script setup lang="ts">
import vite from './assets/vite.png?url'
</script>

<template>
  <img src="./assets/vite.png?abcdefg">
  <img src="@/assets/vite.png">
  <div>{{ vite }}</div>
</template>

<style>
div {
  @font-face {
    src: url('./assets/icon.ttf');
  }
  background: url('./assets/webpack.png');
}
.box1 {
  background: url('@/assets/webpack.png');
}
.box2 {
  background: url('https://example.com/imgs/webpack.png');
}
</style>
