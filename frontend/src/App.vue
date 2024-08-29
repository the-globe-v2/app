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
        @close="handleSidePanelClose"
        @update-related-countries="updateRelatedCountries"
        @article-selected="handleArticleSelection"
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

let globeInstance: Globe | null = null;

// Reactive state
const isSidePanelOpen = ref(false);
const selectedCountry = ref('');
const selectedCountryCode = ref('');
const selectedArticle = ref<any | null>(null);

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
 * Deselects the currently selected country and closes the side panel
 */
const handleSidePanelClose = () => {
  closeSidePanel();
  if (globeInstance) {
    globeInstance.deselectCountry();
  }
};

/**
 * Handles the selection of an article in the side panel
 * @param {any} article - The selected article
 */
const handleArticleSelection = (article: any | null) => {
  selectedArticle.value = article;
  if (article) {
    updateRelatedCountries(new Map(Object.entries(article.related_countries || {})));
  } else {
    updateRelatedCountries(new Map());
  }
};

/**
 * Closes the side panel
 */
const closeSidePanel = () => {
  isSidePanelOpen.value = false;
  selectedCountry.value = '';
  selectedCountryCode.value = '';
};

/**
 * Updates the related countries arcs on the globe visualization
 * @param {Map<string, number>} relatedCountries - A map of related countries and their counts
 * @param {bool} isArticle - Whether the related countries are from an article or a whole origin country
 */
const updateRelatedCountries = (relatedCountries: Map<string, number>, isArticle: boolean) => {
  if (globeInstance && selectedCountryCode.value) {
    globeInstance.updateArcs(selectedCountryCode.value, relatedCountries, isArticle);
  }
};

// Lifecycle hooks
onMounted(() => {
  const container = document.getElementById('globe-container');
  if (container) {
    globeInstance = new Globe(container);
    globeInstance.addEventListener('countrySelected', (event: Event) => {
      const customEvent = event as CustomEvent;
      const country = customEvent.detail.properties.name;
      const cc = customEvent.detail.properties.iso_a2;
      openSidePanel(country, cc);
    });
  }
});
</script>