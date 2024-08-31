import {describe, it, expect, beforeEach} from 'vitest';
import {mount, VueWrapper} from '@vue/test-utils';
import DateRangeSelector from '../src/components/DateRangeSelector.vue';

describe('DateRangeSelector', () => {
    let wrapper: VueWrapper<any>;
    let vm: any;
    const defaultProps = {
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-01-04T23:59:59.999Z'
    };

    beforeEach(() => {
        wrapper = mount(DateRangeSelector, {props: defaultProps});
        vm = wrapper.vm;
    });

    it('renders correctly', () => {
        expect(wrapper.find('.fixed').exists()).toBe(true);
        expect(wrapper.findAll('button').length).toBe(4); // 3 quick options + 1 custom button
    });

    it('initializes with correct default values', () => {
        expect(vm.selectedQuickOption).toBe('4d');
        expect(vm.showCustomDatePicker).toBe(false);
    });

    it('toggles custom date picker when "Custom" button is clicked', async () => {
        const customButton = wrapper.findAll('button').at(3);
        await customButton?.trigger('click');
        expect(wrapper.vm.showCustomDatePicker).toBe(true);
        await customButton?.trigger('click');
        expect(wrapper.vm.showCustomDatePicker).toBe(false);
    });

    it('selects quick option and emits update-date-range event', async () => {
        const quickOptionButton = wrapper.findAll('button').at(0); // '48h' option
        await quickOptionButton?.trigger('click');
        expect(wrapper.vm.selectedQuickOption).toBe('48h');
        expect(wrapper.emitted('update-date-range')).toBeTruthy();
    });

    it('updates custom date range and emits update-date-range event', async () => {
        const customButton = wrapper.findAll('button').at(3);
        await customButton?.trigger('click');

        const dateInput = wrapper.find('input[type="date"]');
        await dateInput.setValue('2023-06-01');

        const applyButton = wrapper.find('button.w-full');
        await applyButton.trigger('click');

        expect(wrapper.emitted('update-date-range')).toBeTruthy();
    });

    it('watches for prop changes and updates internal state', async () => {
        await wrapper.setProps({
            startDate: '2023-02-01T00:00:00.000Z',
            endDate: '2023-02-05T11:59:59.999Z'
        });

        expect(wrapper.vm.selectedDate).toBe('2023-02-01');
        expect(wrapper.vm.rangeValue).toEqual([0, 4]);
    });

    it('applies correct transition classes when toggling custom date picker', async () => {
        const customButton = wrapper.findAll('button').at(3);

        // Initial state: custom date picker should be hidden
        expect(wrapper.find('.bg-white.bg-opacity-50').exists()).toBe(false);

        // Show the custom date picker
        await customButton?.trigger('click');
        await wrapper.vm.$nextTick();

        const transitionElement = wrapper.find('transition-stub');
        expect(transitionElement.exists()).toBe(true);

        expect(transitionElement.attributes().enterfromclass).toContain('opacity-0');
        expect(transitionElement.attributes().enterfromclass).toContain('max-h-0');

        // Simulate the end of enter transition
        await transitionElement.trigger('transitionend');
        await wrapper.vm.$nextTick();

        // Check final enter state
        expect(transitionElement.attributes().entertoclass).toContain('opacity-100');
        expect(transitionElement.attributes().entertoclass).toContain('max-h-[300px]');

        // Hide the custom date picker
        await customButton?.trigger('click');
        await wrapper.vm.$nextTick();


        // Simulate the end of leave transition
        await transitionElement.trigger('transitionend');
        await wrapper.vm.$nextTick();

        // Check final leave state
        expect(transitionElement.attributes().enterfromclass).toContain('opacity-0');
        expect(transitionElement.attributes().enterfromclass).toContain('max-h-0');

        // Verify that the custom date picker is hidden again
        expect(wrapper.find('.bg-white.bg-opacity-50').exists()).toBe(false);
    });

    it('maintains correct content during transition', async () => {
        const customButton = wrapper.findAll('button').at(3);

        // Show the custom date picker
        await customButton?.trigger('click');
        await wrapper.vm.$nextTick();

        const transitionElement = wrapper.find('transition-stub');

        // Check that the content is present even during the enter transition
        expect(transitionElement.find('input[type="date"]').exists()).toBe(true);
        expect(transitionElement.find('.vue-slider').exists()).toBe(true);
        expect(transitionElement.find('button.w-full').exists()).toBe(true);

        // Hide the custom date picker
        await customButton?.trigger('click');
        await wrapper.vm.$nextTick();

        // Check that the content is no longer present after the leave transition
        expect(transitionElement.find('input[type="date"]').exists()).toBe(false);
        expect(transitionElement.findComponent({ name: 'vue-slider' }).exists()).toBe(false);
        expect(transitionElement.find('button.w-full').exists()).toBe(false);
    });

});