<template>
  <div id="app" class="relative">
    <div id="globe-container" class="w-full h-screen"></div>
    <ArticleSidePanel
        :is-open="isSidePanelOpen"
        :country="selectedCountry"
        :country-code="selectedCountryCode"
        @close="closeSidePanel"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { Globe } from './components/Globe';
import ArticleSidePanel from './components/ArticleSidePanel.vue';

export default defineComponent({
  name: 'App',
  components: {
    ArticleSidePanel,
  },
  setup() {
    const isSidePanelOpen = ref(false);
    const selectedCountry = ref('');
    const selectedCountryCode = ref('');

    const openSidePanel = (country: string, cc: string) => {
      selectedCountry.value = country;
      selectedCountryCode.value = cc;
      isSidePanelOpen.value = true;
    };

    const closeSidePanel = () => {
      isSidePanelOpen.value = false;
    };

    onMounted(() => {
      const container = document.getElementById('globe-container');
      if (container) {
        const globe = new Globe(container);
        globe.addEventListener('countrySelected', (event: Event) => {
          const customEvent = event as CustomEvent;
          const country = customEvent.detail.properties.name;
          const cc = customEvent.detail.properties.iso_a2;
          openSidePanel(country, cc);
        });
      }
    });

    return {
      isSidePanelOpen,
      selectedCountry,
      selectedCountryCode,
      closeSidePanel,
    };
  },
});
</script>