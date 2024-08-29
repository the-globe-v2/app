<template>
  <div
      class="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-md p-4"
      @click.stop
      @mousedown.stop
      @touchstart.stop
  >
    <div class="flex items-center justify-center space-x-4 mb-4">
      <button
          v-for="option in quickOptions"
          :key="option.value"
          @click="selectQuickOption(option.value)"
          :class="[
          'px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200',
          selectedQuickOption === option.value
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        {{ option.label }}
      </button>
      <button
          @click="toggleCustomDatePicker"
          :class="[
          'px-3 py-1 text-sm font-medium rounded-full transition-colors duration-200',
          showCustomDatePicker
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        ]"
      >
        Custom
      </button>
    </div>
    <transition
        enter-active-class="transition-all duration-300 ease-out"
        leave-active-class="transition-all duration-200 ease-in"
        enter-from-class="opacity-0 max-h-0"
        enter-to-class="opacity-100 max-h-[300px]"
        leave-from-class="opacity-100 max-h-[300px]"
        leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="showCustomDatePicker" class="space-y-4 overflow-hidden">
        <div class="flex items-center space-x-2 mx-2">
          <span class="text-sm text-gray-600">Date:</span>
          <input
              type="date"
              v-model="selectedDate"
              class="border rounded px-2 py-1 text-sm"
          >
        </div>
        <div class="space-y-2">
          <vue-slider
              v-model="rangeValue"
              :min="-4"
              :max="4"
              :interval="1"
              :process="true"
              :marks="true"
              :hide-label="true"
              :tooltip="'always'"
              :dot-size="14"
              :height="8"
              @change="updateDateRange"
              class="mt-10 mx-4"
          />
        </div>
        <button
            @click="applyCustomDateRange(); toggleCustomDatePicker()"
            class="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200 hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, watch} from 'vue';
import VueSlider from 'vue-slider-component';
import 'vue-slider-component/theme/default.css';

const props = defineProps<{
  startDate: string;
  endDate: string;
}>();

const emit = defineEmits<{
  (e: 'update-date-range', startDate: string, endDate: string): void;
}>();

const quickOptions = [
  {label: '48h', value: '48h'},
  {label: '4d', value: '4d'},
  {label: '7d', value: '7d'},
];

const selectedQuickOption = ref('4d');
const showCustomDatePicker = ref(false);
const selectedDate = ref(new Date().toISOString().split('T')[0]);
const rangeValue = ref([0, 0]);

const rangeStart = computed(() => rangeValue.value[0]);
const rangeEnd = computed(() => rangeValue.value[1]);

const toggleCustomDatePicker = () => {
  showCustomDatePicker.value = !showCustomDatePicker.value;
  if (showCustomDatePicker.value) {
    selectedQuickOption.value = '';
    selectedDate.value = new Date().toISOString().split('T')[0];
    rangeValue.value = [0, 0];
  }
};

const selectQuickOption = (option: string) => {
  selectedQuickOption.value = option;
  showCustomDatePicker.value = false;

  const endDate = new Date();
  let startDate = new Date();

  switch (option) {
    case '48h':
      startDate.setDate(startDate.getDate() - 2);
      break;
    case '4d':
      startDate.setDate(startDate.getDate() - 4);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
  }

  emit('update-date-range', startDate.toISOString(), endDate.toISOString());
};

const updateDateRange = () => {
  const date = new Date(selectedDate.value);
  const startDate = new Date(date);
  const endDate = new Date(date);

  startDate.setDate(startDate.getDate() + rangeStart.value);
  endDate.setDate(endDate.getDate() + rangeEnd.value);

  return {startDate, endDate};
};

const applyCustomDateRange = () => {
  const {startDate, endDate} = updateDateRange();
  emit('update-date-range', startDate.toISOString(), endDate.toISOString());
};

watch(() => props.startDate, (newValue) => {
  if (!showCustomDatePicker.value) {
    selectedDate.value = newValue.split('T')[0];
  }
});

watch(() => props.endDate, (newValue) => {
  if (!showCustomDatePicker.value) {
    const endDate = new Date(newValue);
    const startDate = new Date(selectedDate.value);
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    rangeValue.value = [0, diffDays];
  }
});
</script>

<style scoped>
div[class*="fixed"] {
  pointer-events: all !important;
}
</style>
