<template>
  <!-- Main container positioned at the top-left of the screen -->
  <div class="fixed top-4 left-4 z-50">
    <div
        class="flex flex-col w-64 items-center bg-white bg-opacity-40 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg">
      <!-- Header section with logo and title -->
      <div
          class="flex w-full items-center justify-between bg-white bg-opacity-60 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg p-2">
        <img :src="globeLogo" alt="The Globe Logo" class="w-10 h-10">
        <span
            class="font-extrabold text-3xl text-transparent bg-clip-text bg-gradient-to-tl to-gray-400 from-sky-950 pr-8">The Globe</span>
      </div>

      <!-- Button to toggle the country list, with rotating icon -->
      <button
          @click="toggleCountryList"
          class="mt-0.5 px-14"
      >
        <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-5 w-5 transition ease-in-out"
            viewBox="0 0 20 20"
            fill="currentColor"
            :class="{ 'rotate-180 ': isFlipped }"
        >
          <!-- SVG path for the arrow icon -->
          <path
              fill-rule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>

    <!-- Transition effect for the country list -->
    <transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="max-h-0"
        enter-to-class="opacity-100 max-h-[600px]"
        leave-from-class="opacity-100 max-h-[600px]"
        leave-to-class="max-h-0"
    >
      <!-- Country list container -->
      <div v-if="showCountryList"
           class="mt-2 bg-white bg-opacity-80 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg py-4 pl-4 overflow-hidden">
        <!-- Search input for filtering countries -->
        <input
            v-model="searchQuery"
            type="text"
            placeholder="Search countries..."
            class="w-11/12 p-2 mb-2 border border-gray-300 rounded"
        >

        <!-- List of filtered countries -->
        <div class="max-h-96 overflow-y-auto hide-scrollbar">
          <button
              v-for="[code, name] in filteredCountries"
              :key="code"
              @click="selectCountry(code)"
              class="flex items-center w-11/12 p-2 hover:bg-gray-200 rounded transition-colors duration-200"
              :class="{ 'bg-gray-100': selectedCountry === code }"
          >
            <!-- Country flag and name -->
            <img :src="getCountryFlag(code)" :alt="name + ' flag'" class="w-6 h-4 mr-2">
            <span>{{ name }}</span>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {ref, computed} from 'vue';
import countryListRaw from '@/assets/supportedCountries.json?raw';

const countryList: { [key: string]: string } = JSON.parse(countryListRaw);
import globeLogo from '@/assets/globe-logo.png';


const showCountryList = ref(false); // Boolean to show/hide the country list
const searchQuery = ref(''); // User's search query for filtering countries
const selectedCountry = ref(''); // Stores the currently selected country code
const isFlipped = ref(false); // Boolean to track if the button icon is flipped

// Define the emitted events
const emit = defineEmits<{
  (e: 'country-selected', countryCode: string): void;
}>();

/**
 * Toggles the visibility of the country list and flips the button icon.
 */
const toggleCountryList = () => {
  showCountryList.value = !showCountryList.value;
  isFlipped.value = !isFlipped.value; // Toggle the flip state
};

/**
 * Filters the list of countries based on the user's search query.
 *
 * @returns {Array} A list of countries that match the search query.
 */
const filteredCountries = computed(() => {
  const query = searchQuery.value.toLowerCase();
  return Object.entries(countryList).filter(([code, name]) =>
      name.toLowerCase().includes(query) || code.toLowerCase().includes(query)
  );
});

/**
 * Generates the URL for a country's flag based on its code.
 *
 * @param {string} countryCode - The ISO code of the country.
 * @returns {string} The URL to the country's flag image.
 */
const getCountryFlag = (countryCode: string): string => {
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
};

/**
 * Selects a country by its code and emits the 'country-selected' event.
 *
 * @param {string} countryCode - The ISO code of the selected country.
 */
const selectCountry = (countryCode: string) => {
  selectedCountry.value = countryCode;
  emit('country-selected', countryCode);
};
</script>

<style scoped>
/* Hide scrollbar for cleaner look */
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}
</style>