<template>
  <div
      class="fixed right-4 top-4 bottom-4 w-full max-w-md bg-white shadow-lg rounded-2xl overflow-hidden transition-transform duration-300 ease-in-out transform"
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
        <div class="space-y-4">
          <div v-for="(item, index) in trendingItems" :key="index"
               class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4">
            <div class="flex mb-3">
              <img :src="item.image_url" alt="Article Thumbnail" class="w-1/3 h-24 object-cover rounded-lg mr-4">
              <div class="flex-grow flex flex-col justify-between">
                <h3 class="text-lg font-semibold leading-tight">{{ truncateText(item.title, 80, true) }}</h3>
                <div class="flex justify-between items-center text-xs">
                  <span class="text-gray-600">📰 {{ item.provider }}</span>
                  <span class="text-gray-500">{{ formatDate(item.date_published.$date) }}</span>
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
import {ref} from 'vue'

const props = defineProps<{
  isOpen: boolean
  country: string
  countryCode: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

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


// Mock data for trending items (same as before)
const trendingItems = ref([
  {
    "_id": {
      "$oid": "66ccd22055475d6cb4a4a793"
    },
    "title": "Pavel Durov, the libertarian creator of Telegram who irritates Russia and the West",
    "url": "https://www.msn.com/es-us/noticias/Miami/p%C3%A1vel-d%C3%BArov-el-libertario-creador-de-telegram-que-irrita-a-rusia-y-occidente/ar-AA1psa8T",
    "description": "The Russian Pavel Durov, creator with his brother of the encrypted messaging network Telegram and currently detained on French soil, has managed to irritate Russia and the West alike with his",
    "date_published": {
      "$date": "2024-08-26T12:48:34.000Z"
    },
    "provider": "El Nuevo Herald",
    "language": "es",
    "origin_country": "US",
    "keywords": [
      "Telegram",
      "Pavel Durov",
      "encryption",
      "political pressure",
      "digital privacy"
    ],
    "category": "TECHNOLOGY",
    "authors": [],
    "related_countries": [
      "RU",
      "FR",
      "DE",
      "BR"
    ],
    "image_url": "https://www.bing.com/th?id=ORMS.a16e4e5801ebf98da5edefdd8172393e",
  },
  {
    "title": "Horoscope for Monday, August 26 of Walter Mercado's Las Estrellas",
    "url": "https://www.msn.com/es-us/noticias/Miami/hor%C3%B3scopo-para-lunes-26-de-agosto-de-las-estrellas-de-walter-mercado/ar-AA1ppzpN",
    "description": "Note to readers: Betty B. Mercado, niece and collaborator of the late astrologer Walter Mercado, continues her legacy by writing Sunday's horoscope. Aries (March 20 - April 18) Nobody",
    "date_published": {
      "$date": "2024-08-25T21:30:00.000Z"
    },
    "provider": "El Nuevo Herald",
    "language": "es",
    "origin_country": "US",
    "keywords": [
      "horoscope",
      "astrology",
      "personal growth",
      "financial opportunities",
      "self-love"
    ],
    "category": "SOCIETY",
    "authors": [],
    "related_countries": [],
    "image_url": "https://www.bing.com/th?id=OVFT.yMB54wgkwm80NQrEizdFgS",
  },
  {
    "url": "https://www.msn.com/es-ar/noticias/argentina/javier-milei-ratific%C3%B3-que-vetar%C3%A1-la-reforma-jubilatoria-si-la-aprueba-el-senado/ar-AA1pg58m",
    "date_published": {
      "$date": "2024-08-22T16:12:23.000Z"
    },
    "provider": "Perfil",
    "language": "es",
    "origin_country": "AR",
    "keywords": [
      "Javier Milei",
      "pension reform",
      "Senate debate",
      "fiscal balance",
      "political cost"
    ],
    "category": "POLITICS",
    "authors": [],
    "related_countries": [],
    "image_url": "https://www.bing.com/th?id=OVFT.U09AqDdKyGVj7e-3nVPKJS",
    "title": "Javier Milei confirmed that he will veto the pension reform if it is approved by the Senate",
    "description": "President Javier Milei ratified that he will veto the Pension Reform that is being debated by the Senate in these hours, if it becomes law, In his hectic activity on social networks, the first"
  },

  {
    "url": "https://www.msn.com/en-ph/news/national/nbi-shiela-guo-is-chinese-citizen-zhang-mier/ar-AA1pjEbN",
    "date_published": {
      "$date": "2024-08-23T12:21:37.000Z"
    },
    "provider": "GMA News Online",
    "language": "en",
    "origin_country": "PH",
    "keywords": [
      "Shiela Guo",
      "Zhang Mier",
      "Philippine Offshore Gaming Operator",
      "obstruction of justice",
      "immigration law"
    ],
    "category": "POLITICS",
    "authors": [],
    "related_countries": [
      "CN",
      "ID"
    ],
    "image_url": "https://www.bing.com/th?id=OVFT.zLkqEZECROkmzFeQE-v3-i",
    "title": "NBI: Shiela Guo is Chinese citizen Zhang Mier",
    "description": "Shiela Guo, sister of dismissed Bamban, Tarlac Mayor Alice Guo, is a Chinese citizen named Zhang Mier who \"fraudulently acquired\" a Philippine passport, Philippine officials said Friday upon"
  },
  {
    "url": "https://www.msn.com/da-dk/nyheder/other/man-skulle-tro-det-var-l%C3%B8gn-her-er-lurpak-p%C3%A5-tilbud-til-under-9-kroner/ar-AA1pi9IQ",
    "date_published": {
      "$date": "2024-08-23T07:43:48.000Z"
    },
    "provider": "Nyheder24.dk",
    "language": "da",
    "origin_country": "DK",
    "keywords": [
      "Lurpak",
      "discount",
      "butter",
      "Danish market",
      "consumer behavior"
    ],
    "category": "ECONOMY",
    "authors": [],
    "related_countries": [],
    "image_url": "https://www.bing.com/th?id=OVFT.Kb4d0uJNM1BKY-ZSZ8N8ty",
    "title": "You'd think it was a lie: Here's Lurpak on sale for less than 9 kroner",
    "description": "It is no secret that Lurpak has a very special place in the hearts of Danes. The well-known and delicious taste has made the popular butter a staple of many breakfast tables, but it can still be"
  },
  {
    "url": "https://www.msn.com/fr-ca/actualites/ontario/quand-les-galeries-d-art-font-les-frais-de-l-embourgeoisement/ar-AA1pm46Y",
    "date_published": {
      "$date": "2024-08-24T09:39:55.000Z"
    },
    "provider": "Radio-Canada.ca",
    "language": "fr",
    "origin_country": "CA",
    "keywords": [
      "Propeller Gallery",
      "emerging artists",
      "Toronto arts community",
      "funding challenges",
      "cultural economy"
    ],
    "category": "CULTURE",
    "authors": [],
    "related_countries": [],
    "image_url": "https://www.bing.com/th?id=OVFT.XpzweBmGo4fsEeh4-IP7jS",
    "title": "When art galleries pay the price of gentrification",
    "description": "The situation is precarious for some art galleries in Toronto due to the cost of living. Even with public subsidies, many of them are struggling to make ends meet and have to"
  },
  {
    "url": "https://www.msn.com/en-nz/news/other/trump-aides-desperately-trying-to-stop-him-golfing-and-focus-on-election-as-critic-says-he-s-lost-his-mojo-report/ar-AA1pp8dV",
    "date_published": {
      "$date": "2024-08-25T15:46:53.000Z"
    },
    "provider": "The Independent",
    "language": "en",
    "origin_country": "NZ",
    "keywords": [
      "Donald Trump",
      "campaign trail",
      "Kamala Harris",
      "2024 election",
      "political strategy"
    ],
    "category": "POLITICS",
    "authors": [],
    "related_countries": [
      "US"
    ],
    "image_url": "https://www.bing.com/th?id=OVFT.HhrtJ8GGBqRitSptRVPfvS",
    "title": "Trump aides desperately trying to stop him golfing and focus on election as critic says he’s ‘lost his mojo’: Report",
    "description": "Aides to former Donald Trump are reportedly trying to get the former president off the golf course and onto the campaign trail. But as his family visits his Bedminster, New Jersey golf course in"
  }

])
</script>