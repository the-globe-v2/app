<template>
  <div
      class="fixed top-4 bottom-4 bg-white shadow-lg rounded-2xl overflow-hidden transition-all duration-300 ease-in-out transform z-50 backdrop-filter backdrop-blur-lg bg-opacity-30 max-w-6xl"
      :class="[
      { 'translate-x-0': isOpen, 'translate-x-[120%]': !isOpen },
      'right-4'
    ]"
      :style="{ width: panelWidth }"
      @click.stop
      @mousedown.stop
      @touchstart.stop
  >
    <div class="h-full flex flex-col">
      <!-- Header -->
      <div class="p-4 bg-white opacity-90 text-gray-800 flex items-center justify-between">
        <div class="flex items-center">
          <img
              :src="getCountryFlag(countryCode)"
              :alt="country + ' flag'"
              class="w-8 h-6 mr-3 inline-block object-cover rounded"
          >
          <h2 class="text-2xl font-semibold">Trending in {{ country }}</h2>
        </div>
        <div class="flex items-center space-x-2">
          <button
              id="expand-panel-btn"
              @click="toggleExpand"
              class="text-gray-800 hover:text-blue-700 transition-colors"
          >
            <svg
                class="h-6 w-6 transition-transform duration-300"
                :class="{ 'rotate-180': isExpanded }"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <button
              id="close-panel-btn"
              @click="closePanel"
              class="text-gray-800 hover:text-red-700 transition-colors"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <!-- Main content area -->
      <div
          class="p-4 overflow-y-auto flex-grow bg-gray-50 bg-opacity-10 backdrop-filter backdrop-blur-lg hide-scrollbar"
          ref="articlesContainer"
      >
        <div :class="{ 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4': isExpanded, 'space-y-4': !isExpanded }">
          <!-- Loading spinner -->
          <div v-if="loading" class="col-span-full flex justify-center items-center h-full w-full">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
          <!-- Error message -->
          <div v-else-if="error" class="col-span-full font-semibold text-red-600 pt-10 text-center w-full">
            {{ error }}
          </div>
          <!-- Informational message -->
          <div v-else-if="message" class="col-span-full font-semibold text-gray-800 pt-10 text-center w-full">
            {{ message }}
          </div>
          <!-- No articles found message -->
          <div v-else-if="loadedArticles.length === 0" class="col-span-full text-gray-800 text-center pt-10 w-full">
            No articles found for in the selected date range.
          </div>
          <!-- Article cards -->
          <div
              v-else
              v-for="(item, index) in loadedArticles"
              :key="index"
              :ref="(el) => { if (el) articleRefs[item.url] = el as Element }"
              @click="handleArticleClick(item)"
              class="bg-white rounded-lg hover:shadow-md transition-shadow p-4 cursor-pointer backdrop-filter backdrop-blur-lg flex flex-col justify-between max-w-md"
              :class="[
              selectedArticleUrl === item.url ? 'bg-opacity-90 shadow-md' : 'bg-opacity-50 shadow-sm',
            ]"
          >
            <!-- Article card content -->
            <div>
              <div class="flex mb-3">
                <img
                    :src="item?.image_url || defaultThumbnail"
                    alt="Article Thumbnail"
                    class="w-1/3 h-24 object-cover rounded-lg mr-4"
                >
                <div class="flex-grow flex flex-col justify-between">
                  <h3 class="text-lg font-semibold leading-tight">
                    {{ truncateText(item?.title || 'No title', 75, true) }}
                  </h3>
                  <div class="flex justify-between items-center text-xs">
                    <span class="text-gray-600">📰 {{ item?.provider || 'Unknown provider' }}</span>
                    <span class="text-gray-500">{{ formatDate(item?.date_published) }}</span>
                  </div>
                </div>
              </div>
              <p class="text-sm text-gray-600 mb-2">
                {{ truncateText(item?.description || 'No description available', 200) }}
              </p>
            </div>
            <!-- Article card footer -->
            <div class="flex justify-between items-center text-xs mt-auto">
              <span class="text-blue-600">#{{ item?.category || 'Uncategorized' }}</span>
              <span class="text-gray-500">{{ item?.related_countries?.join(', ') || '' }}</span>
              <a :href="item?.url"
                 target="_blank"
                 rel="noopener noreferrer"
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
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.hide-scrollbar::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none;
}

div[class*="fixed"] {
  pointer-events: all !important;
  transition: width 0.3s ease-in-out, transform 0.3s ease-in-out;
}
</style>

<script setup lang="ts">
import {ref, watch, onMounted, computed} from 'vue';
import {Article} from '../types/article';
import {fetchArticleCollections, fetchArticles} from '../services/api';
import earthFlag from '@/assets/planet-earth-flag.jpg';
import defaultThumbnail from '@/assets/default-thumbnail.png';

// Component props
const props = defineProps<{
  isOpen: boolean;
  country: string;
  countryCode: string;
  dateStart: string;
  dateEnd: string;
}>();

// Component emits
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'update-related-countries', relatedCountries: Map<string, number>, isArticle: boolean): void;
  (e: 'article-selected', articleUrl: string): void;
}>();

// Component state
const loadedArticles = ref<Article[]>([]);
const loading = ref(false);
const error = ref('');
const message = ref('');
const articleCollections = ref<any[]>([]);
const articleCache = ref<Map<string, any>>(new Map());
const selectedArticleUrl = ref<string | null>(null);
const isExpanded = ref(false);
const baseWidth = 384;
const expandedWidth = window.innerWidth - 32;
const articlesContainer = ref<HTMLElement | null>(null);
const articleRefs = ref<{ [key: string]: Element | null }>({});

// Computed properties
const panelWidth = computed(() => {
  return isExpanded.value ? `${expandedWidth}px` : `${baseWidth}px`;
});

/**
 * Toggles the expanded state of the panel
 */
const toggleExpand = () => {
      isExpanded.value = !isExpanded.value;
};

/**
 * Closes the panel and resets the expanded state
 */
const closePanel = () => {
  isExpanded.value = false;
  emit('close');
};

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
    setTimeout(() => {
      loading.value = false;
    }, 100);
  }
};

/**
 * Fetches articles for the selected country based on the currently loaded collections
 * It uses the articleCache to avoid re-fetching articles that have already been loaded
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
      loadedArticles.value = []; // Clear previous articles
      emit('update-related-countries', new Map(), false); // Clear previous country arcs
      message.value = 'No articles found for in the selected date range. This country may not be supported yet.';
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
      message.value = 'No articles found for this country. Please expand date range.';
      // Clear previous country arcs
      emit('update-related-countries', new Map(), false);
    } else {
      loadedArticles.value = updatedArticles;

      // Create a Map to store related countries and their mention count
      const relatedCountriesMap = processRelatedCountries(updatedArticles);

      // Emit the related countries data
      emit('update-related-countries', relatedCountriesMap, false);
    }
  } catch (err) {
    console.error('Error fetching articles:', err);
    error.value = 'Failed to fetch articles. Please try again later.';
  } finally {
    setTimeout(() => {
      loading.value = false;
    }, 100);
  }
};

/**
 * Processes all given articles to find related countries and emits the result
 *
 * @param {any[]} articles - The articles to process as a map, counting how many times each country appears
 * @returns {Map<string, number>} - A map of related countries and their counts
 */
const processRelatedCountries = (articles: any[]): Map<string, number> => {
  const relatedCountriesMap = new Map<string, number>();

  articles.forEach(article => {
    if (Array.isArray(article.related_countries)) {
      article.related_countries.forEach((country: string) => {
        if (country !== props.countryCode) {  // Exclude the selected country
          relatedCountriesMap.set(country, (relatedCountriesMap.get(country) || 0) + 1);
        }
      });
    }
  });

  return relatedCountriesMap;
};

/**
 * Updates both collections and articles based on the selected date range and country
 * This function is called whenever the date range or country changes
 */
const updateArticles = async () => {
  await fetchCollections();
  if (props.countryCode) {
    await fetchArticlesForCountry();
  }
};

/**
 * Handles the click event on an article card, emitting all countries related to the article
 * If the same article is clicked, deselect it and reset the related countries to the country
 * If the side panel is expanded, scroll to the selected article and shrink the panel
 *
 * @param {any} article - The clicked article
 */
const handleArticleClick = (article: any) => {
  if (selectedArticleUrl.value === article.url) {
    // Deselect if clicking the same article
    selectedArticleUrl.value = null;
    emit('article-selected', '');
    // Reset the related countries to the selected country
    emit('update-related-countries', processRelatedCountries(loadedArticles.value), false);
  } else {
    selectedArticleUrl.value = article.url;
    emit('article-selected', article);
    if (article.related_countries) {
      const relatedCountriesMap = processRelatedCountries([article]);
      emit('update-related-countries', relatedCountriesMap, true);
    } else {
      emit('update-related-countries', new Map(), true);
    }
  }
  if (isExpanded.value) {
    isExpanded.value = false;
    // Wait for the transition to complete before scrolling
    setTimeout(() => {
      scrollToSelectedArticle();
    }, 300);
  }
};

/**
 * Scrolls to the selected article in the sidebar
 */
const scrollToSelectedArticle = () => {
  if (selectedArticleUrl.value && articleRefs.value[selectedArticleUrl.value]) {
    const element = articleRefs.value[selectedArticleUrl.value];
    if (element instanceof HTMLElement) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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
 *
 * @param {string} text - The text to truncate
 * @param {number} limit - The maximum length of the text
 * @param {boolean} title - Whether the text is a title (affects truncation behavior)
 * @returns {string} - The truncated text
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
 *
 * @param {string} dateString - The date string to format
 * @returns {string} - The formatted date string
 */
const formatDate = (dateString: Date): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

/**
 * Gets the URL for a country's flag image
 *
 * @param {string} countryCode - The country code
 * @returns {string} - The URL of the flag image
 */
const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) {
    return earthFlag;
  }
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
}
</script>