<template>
  <div id="app" class="relative">
    <div id="globe-container" class="w-full h-screen"></div>
    <DateRangeSelector
        :start-date="startDate"
        :end-date="endDate"
        @update-date-range="updateDateRange"
    />
    <ArticleSidePanel
        :is-open="isSidePanelOpen"
        :country="selectedCountry"
        :country-code="selectedCountryCode"
        :date-start="startDate"
        :date-end="endDate"
        @close="closeSidePanel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Globe } from './components/Globe';
import ArticleSidePanel from './components/ArticleSidePanel.vue';
import DateRangeSelector from './components/DateRangeSelector.vue';

const isSidePanelOpen = ref(false);
const selectedCountry = ref('');
const selectedCountryCode = ref('');

// Initialize with a default date range (e.g., last 7 days)
const startDate = ref(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
const endDate = ref(new Date().toISOString());

const updateDateRange = (newStartDate: string, newEndDate: string) => {
  startDate.value = newStartDate;
  endDate.value = newEndDate;
  // If the side panel is open, we might want to refresh its content
  if (isSidePanelOpen.value) {
    // Trigger a re-fetch of articles in the ArticleSidePanel
    // This could be done via a ref or by re-opening the panel
  }
};

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
</script>