<template>
  <div
      class="fixed right-4 top-4 bottom-4 w-full max-w-md bg-white shadow-lg rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out transform z-50"
      :class="{ 'translate-x-0': isOpen, 'translate-x-[120%]': !isOpen }"
      @click.stop
      @mousedown.stop
      @touchstart.stop
  >
    <div class="h-full flex flex-col">
      <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-400 text-white flex items-center justify-between">
        <div class="flex items-center">
          <img
              :src="getCountryFlag(countryCode)"
              :alt="country + ' flag'"
              class="w-8 h-6 mr-3 inline-block object-cover rounded"
          >
          <h2 class="text-2xl font-semibold">Trending in {{ country }}</h2>
        </div>
        <button
            @click="$emit('close')"
            class="text-white hover:text-gray-200 transition-colors"
        >
          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="p-4 overflow-y-auto flex-grow bg-gray-50 hide-scrollbar">
        <div v-if="loading" class="flex justify-center items-center h-full">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="text-red-500 text-center">
          {{ error }}
        </div>
        <div v-else-if="message" class="text-gray-500 text-center">
          {{ message }}
        </div>
        <div v-else class="space-y-4">
          <div v-for="(item, index) in trendingItems" :key="index"
               class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
            <div class="flex mb-3">
              <img
                  :src="item.image_url || '/src/assets/default-thumbnail.png'"
                  alt="Article Thumbnail"
                  class="w-1/3 h-24 object-cover rounded-lg mr-4"
              >
              <div class="flex-grow flex flex-col justify-between">
                <h3 class="text-lg font-semibold leading-tight">{{ truncateText(item.title, 75, true) }}</h3>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600">📰 {{ item.provider }}</span>
                  <span class="text-gray-500">{{ formatDate(item.date_published) }}</span>
                </div>
              </div>
            </div>
            <p class="text-sm text-gray-600 mb-2">{{ truncateText(item.description, 200) }}</p>
            <div class="flex justify-between items-center text-xs">
              <span class="text-blue-600">#{{ item.category }}</span>
              <a :href="item.url" target="_blank" rel="noopener noreferrer"
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
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* Internet Explorer 10+ */
}

.hide-scrollbar::-webkit-scrollbar {
  width: 0;
  height: 0;
  display: none; /* Safari and Chrome */
}

div[class*="fixed"] {
  pointer-events: all !important; /* Allow clicks on the panel */
}
</style>

<script setup lang="ts">
import {ref, watch} from 'vue'
import axios from 'axios'

const props = defineProps<{
  isOpen: boolean
  country: string
  countryCode: string
  dateStart: string
  dateEnd: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const trendingItems = ref([])
const loading = ref(false)
const error = ref('')
const message = ref('')

const fetchArticles = async () => {
  loading.value = true
  error.value = ''
  message.value = ''

  try {
    const response = await axios.get('/api/articles', {
      params: {
        origin_country: props.countryCode,
        date_start: props.dateStart,
        date_end: props.dateEnd
      }
    })
    trendingItems.value = response.data

    if (trendingItems.value.length === 0) {
      message.value = 'This country is not yet supported. 🙃'
    }
  } catch (err) {
    console.error('Error fetching articles:', err)
    error.value = 'Failed to fetch articles. Please try again later.'
  } finally {
    // Add a small delay before setting loading to false
    await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
    loading.value = false
  }
}

watch(() => props.countryCode, fetchArticles)
watch(() => props.dateStart, fetchArticles)
watch(() => props.dateEnd, fetchArticles)

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

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
}

const getCountryFlag = (countryCode: string): string => {
  if (!countryCode) {
    return '/src/assets/planet-earth-flag.jpg';
  }
  return `https://purecatamphetamine.github.io/country-flag-icons/3x2/${countryCode.toUpperCase()}.svg`;
}
</script>