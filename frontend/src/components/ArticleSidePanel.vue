<template>
  <!-- ArticleSidePanel component template -->
  <div
      class="fixed right-4 top-4 bottom-4 w-full max-w-md bg-white shadow-lg rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out transform z-50"
      :class="{ 'translate-x-0': isOpen, 'translate-x-[120%]': !isOpen }"
      @click.stop
      @mousedown.stop
      @touchstart.stop
  >
    <!-- Panel content -->
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex items-center justify-between">
        <!-- Country flag and name -->
        <div class="flex items-center">
          <img
              :src="getCountryFlag(countryCode)"
              :alt="country + ' flag'"
              class="w-8 h-6 mr-3 inline-block object-cover rounded"
          >
          <h2 class="text-2xl font-semibold">Trending in {{ country }}</h2>
        </div>
        <!-- Close button -->
        <button
            @click="$emit('close')"
            class="text-white hover:text-gray-200 transition-colors"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <!-- Main content area -->
      <div class="p-4 overflow-y-auto flex-grow bg-gray-50 hide-scrollbar">
        <!-- Loading spinner -->
        <div v-if="loading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <!-- Error message -->
        <div v-else-if="error" class="text-red-500 text-center">
          {{ error }}
        </div>
        <!-- Informational message -->
        <div v-else-if="message" class="text-gray-500 text-center">
          {{ message }}
        </div>
        <!-- Article list -->
        <div v-else class="space-y-4">
          <div v-for="(item, index) in trendingItems" :key="index"
               class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
            <!-- Article card content -->
            <div class="flex mb-3">
              <img
                  :src="item?.image_url || '/src/assets/default-thumbnail.png'"
                  alt="Article Thumbnail"
                  class="w-1/3 h-24 object-cover rounded-lg mr-4"
              >
              <div class="flex-grow flex flex-col justify-between">
                <h3 class="text-lg font-semibold leading-tight">{{ truncateText(item?.title || 'No title', 75, true) }}</h3>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600">📰 {{ item?.provider || 'Unknown provider' }}</span>
                  <span class="text-gray-500">{{ formatDate(item?.date_published) }}</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ truncateText(item?.description || 'No description available', 200) }}</p>
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-600">#{{ item?.category || 'Uncategorized' }}</span>
              <a :href="item?.url" target="_blank" rel="noopener noreferrer"
                 class="text-blue-600 hover:text-blue-800 font-medium">
                Read More →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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

/* Ensure panel is clickable */
div[class*="fixed"] {
  pointer-events: all !important;
}
</style>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { fetchArticleCollections, fetchArticles } from "../services/api";

/**
 * ArticleSidePanel component
 *
 * This component displays a sliding panel with trending articles for a selected country.
 * It fetches article collections based on a date range and loads articles for a specific country.
 */

// Component props
const props = defineProps<{
  isOpen: boolean
  country: string
  countryCode: string
  dateStart: string
  dateEnd: string
}>()

// Component emits
const emit = defineEmits<{
  (e: 'close'): void
}>()

// Component state
const trendingItems = ref([])
const loading = ref(false)
const error = ref('')
const message = ref('')
const articleCollections = ref<any[]>([]);
const articleCache = ref<Map<string, any>>(new Map()); // Cache articles to avoid re-fetching

/**
 * Fetches article collections for the given date range
 */
const fetchCollections = async () => {
  loading.value = true;
  error.value = '';
  message.value = '';

  try {
    articleCollections.value = await fetchArticleCollections(props.dateStart, props.dateEnd);
  } catch (err) {
    console.error('Error fetching article collections:', err);
    error.value = 'Failed to fetch article collections. Please try again later.';
  } finally {
    // Add a 100ms delay before turning off the loading state
    setTimeout(() => {
      loading.value = false;
    }, 100);
  }
};

/**
 * Fetches articles for the selected country
 */
const fetchArticlesForCountry = async () => {
  if (!props.countryCode) return;

  loading.value = true;
  error.value = '';
  message.value = '';

  try {
    const countryCollection = articleCollections.value
        .flatMap(collection => collection.countries)
        .filter(country => country.country === props.countryCode);

    const urls = countryCollection.flatMap(collection => collection.article_urls);

    if (urls.length === 0) {
      trendingItems.value = []; // Clear only if no articles found
      message.value = 'No articles found for this country in the selected date range.';
      return;
    }

    const cachedArticles = urls.filter(url => articleCache.value.has(url)).map(url => articleCache.value.get(url));
    const uncachedUrls = urls.filter(url => !articleCache.value.has(url));

    let newArticles = [];
    if (uncachedUrls.length > 0) {
      newArticles = await fetchArticles(uncachedUrls);
      newArticles.forEach(article => articleCache.value.set(article.url, article));
    }

    const updatedArticles = [...cachedArticles, ...newArticles];

    if (updatedArticles.length === 0) {
      message.value = 'No articles found for this country in the selected date range.';
    } else {
      trendingItems.value = updatedArticles; // Update only when new articles are ready
    }
  } catch (err) {
    console.error('Error fetching articles:', err);
    error.value = 'Failed to fetch articles. Please try again later.';
  } finally {
    // Add a 100ms delay before turning off the loading state
    setTimeout(() => {
      loading.value = false;
    }, 100);
  }
};

/**
 * Updates both collections and articles
 */
const updateArticles = async () => {
  await fetchCollections();
  if (props.countryCode) {
    await fetchArticlesForCountry();
  }
};

// Lifecycle hooks
onMounted(fetchCollections);

// Watchers
watch(() => props.dateStart, updateArticles);
watch(() => props.dateEnd, updateArticles);
watch(() => props.countryCode, fetchArticlesForCountry);

/**
 * Truncates text to a specified length so that it fits within the cards
 * @param {string} text - The text to truncate
 * @param {number} limit - The maximum length of the text
 * @param {boolean} title - Whether the text is a title (affects truncation behavior)
 * @returns {string} The truncated text
 */
const truncateText = (text: string, limit: number = 200, title: boolean = false): string => {
  if (text.length <= limit && title) {
    return text; // If the text is shorter than the limit, return it as is, only for the title
  }

  const truncatedText = text.substring(0, limit);
  const lastSpaceIndex = truncatedText.lastIndexOf(' ');

  // If there's a space in the truncated part, cut off at the last space
  if (lastSpaceIndex !== -1) {
    return truncatedText.substring(0, lastSpaceIndex) + '...';
  }

  // If there's no space, return the truncated text with ellipsis
  return truncatedText + '...';
}

/**
 * Formats a date string to a more readable format
 * @param {string} dateString - The date string to format
 * @returns {string} The formatted date string
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

/**
 * Gets the URL for a country's flag image
 * @param {string} countryCode - The country code
 * @returns {string} The URL of the flag image
 */
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) {
    return '/src/assets/planet-earth-flag.jpg';
  }
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
}
</script>