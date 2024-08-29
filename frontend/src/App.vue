<template>
  <div id="app" class="relative">
    <!-- Globe container -->
    <div id="globe-container" class="w-full h-screen"></div>

    <!-- Date range selector component -->
    <DateRangeSelector
        :start-date="startDate"
        :end-date="endDate"
        @update-date-range="updateDateRange"
    />

    <!-- Article side panel component -->
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
import {ref, onMounted} from 'vue';
import {Globe} from './components/Globe';
import ArticleSidePanel from './components/ArticleSidePanel.vue';
import DateRangeSelector from './components/DateRangeSelector.vue';

/**
 * App component
 *
 * This is the main component of the application. It manages the globe visualization,
 * date range selection, and the article side panel.
 */

// Reactive state
const isSidePanelOpen = ref(false);
const selectedCountry = ref('');
const selectedCountryCode = ref('');

// Initialize with a default date range (last 4 days)
const startDate = ref(new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString());
const endDate = ref(new Date().toISOString());

/**
 * Updates the date range and refreshes article data if necessary
 * @param {string} newStartDate - The new start date
 * @param {string} newEndDate - The new end date
 */
const updateDateRange = (newStartDate: string, newEndDate: string) => {
  startDate.value = newStartDate;
  endDate.value = newEndDate;
  // If the side panel is open, the panel needs some sort of animation to more smoothly update the content
  // This could be done via a ref or by re-opening the panel
};

/**
 * Opens the side panel with the selected country's information
 * @param {string} country - The name of the selected country
 * @param {string} cc - The country code of the selected country
 */
const openSidePanel = (country: string, cc: string) => {
  selectedCountry.value = country;
  selectedCountryCode.value = cc;
  isSidePanelOpen.value = true;
};

/**
 * Closes the side panel
 */
const closeSidePanel = () => {
  isSidePanelOpen.value = false;
};

// Lifecycle hooks
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