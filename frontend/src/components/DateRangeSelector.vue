<template>
  <div
      class="fixed bottom-4 left-4 z-50 bg-white rounded-lg shadow-md p-4"
      @click.stop
      @mousedown.stop
      @touchstart.stop
  >
    <div class="flex items-center space-x-4">
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
        enter-to-class="opacity-100 max-h-[200px]"
        leave-from-class="opacity-100 max-h-[200px]"
        leave-to-class="opacity-0 max-h-0"
    >
      <div v-if="showCustomDatePicker" class="mt-4 space-y-2 overflow-hidden">
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600">Start:</span>
          <input
              type="date"
              v-model="localStartDate"
              class="border rounded px-2 py-1 text-sm"
          >
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm text-gray-600 pr-1.5">End:</span>
          <input
              type="date"
              v-model="localEndDate"
              class="border rounded px-2 py-1 text-sm"
          >
        </div>
        <button
            @click="applyCustomDateRange"
            class="w-full bg-blue-600 text-white px-3 py-1 rounded text-sm transition-colors duration-200 hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </transition>
  </div>
</template>

<style scoped>

div[class*="fixed"] {
  pointer-events: all !important; /* Allow clicks on the panel */
}
</style>

<script setup lang="ts">
import {ref, watch} from 'vue';

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

const selectedQuickOption = ref('7d');
const showCustomDatePicker = ref(false);
const localStartDate = ref(props.startDate.split('T')[0]);
const localEndDate = ref(props.endDate.split('T')[0]);

const toggleCustomDatePicker = () => {
  showCustomDatePicker.value = !showCustomDatePicker.value;
  if (showCustomDatePicker.value) {
    selectedQuickOption.value = '';
  }
};

const selectQuickOption = (option: string) => {
  selectedQuickOption.value = option;
  showCustomDatePicker.value = false;

  const endDate = new Date();
  let startDate = new Date();
  console.log(startDate);

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

const applyCustomDateRange = () => {
  const startDate = new Date(localStartDate.value);
  const endDate = new Date(localEndDate.value);
  emit('update-date-range', startDate.toISOString(), endDate.toISOString());
};

watch(() => props.startDate, (newValue) => {
  localStartDate.value = newValue.split('T')[0];
});

watch(() => props.endDate, (newValue) => {
  localEndDate.value = newValue.split('T')[0];
});
</script>