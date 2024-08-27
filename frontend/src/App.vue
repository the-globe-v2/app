<template>
  <div id="app">
    <div id="globe-container"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { Globe } from './components/Globe';

export default defineComponent({
  name: 'App',
  setup() {
    onMounted(() => {
      const container = document.getElementById('globe-container');
      if (container) {
        new Globe(container);
      }
    });
  }
});
</script>

<style>
#app {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#globe-container {
  flex-grow: 1;
  width: 100%;
}
</style>