import {describe, it, expect, beforeEach} from "vitest";
import {mount, VueWrapper} from "@vue/test-utils";
import CountrySelector from "../src/components/CountrySelector.vue";


describe("CountrySelector", () => {
    let wrapper: VueWrapper<any>;
    let vm: any;

    beforeEach(() => {
        wrapper = mount(CountrySelector);
        vm = wrapper.vm as any;
    });

    it("renders correctly", () => {
        expect(wrapper.find('img[alt="The Globe Logo"]').exists()).toBe(true);
        expect(wrapper.find('span').text()).toBe("The Globe");
        expect(wrapper.find('button#toggle-country-list').exists()).toBe(true);
    });

    it('has correct initial states', () => {

        expect(vm.showCountryList).toBe(false);
        expect(vm.isFlipped).toBe(false);
        expect(vm.selectedCountry).toBe('');
    });

    it('toggles country list when the arrow is clicked', async () => {

        const button = wrapper.find('button#toggle-country-list');
        expect(wrapper.find('#country-list').exists()).toBe(false);

        await button.trigger('click');
        expect(wrapper.find('#country-list').exists()).toBe(true);
        expect(wrapper.findAll('#country-list button').length).toBe(34);
        expect(vm.showCountryList).toBe(true);
        expect(vm.isFlipped).toBe(true);

        await button.trigger('click');
        expect(wrapper.find('#country-list').exists()).toBe(false);
        expect(vm.showCountryList).toBe(false);
        expect(vm.isFlipped).toBe(false);
    });

    it('filters countries when the input is typed', async () => {
        await wrapper.find('button#toggle-country-list').trigger('click');

        const input = wrapper.find('input[type="text"]');
        await input.setValue('United');
        expect(vm.searchQuery).toBe('United');
        expect(wrapper.findAll('#country-list button').length).toBe(2);

        await input.setValue('United States');
        expect(vm.searchQuery).toBe('United States');
        expect(wrapper.findAll('#country-list button').length).toBe(1);
    });

    it('emits the selected country when a country is clicked', async () => {

        await wrapper.find('button#toggle-country-list').trigger('click');
        const firstCountry = wrapper.findAll('#country-list button').at(0);

        await firstCountry?.trigger('click');
        expect(vm.selectedCountry).toBeTruthy();
        expect(wrapper.emitted('country-selected')).toBeTruthy();
    });

    describe("Edge Cases and Error Handling", () => {
        it('handles empty search query gracefully', async () => {
            await wrapper.find('button#toggle-country-list').trigger('click');
            const input = wrapper.find('input[type="text"]');

            await input.setValue('');
            expect(wrapper.findAll('#country-list button').length).toBe(34);
        });

        it('handles search query with no results', async () => {
            await wrapper.find('button#toggle-country-list').trigger('click');
            const input = wrapper.find('input[type="text"]');

            await input.setValue('NonexistentCountry');
            expect(wrapper.findAll('#country-list button').length).toBe(0);
        });

        it('handles special characters in search query', async () => {
            await wrapper.find('button#toggle-country-list').trigger('click');
            const input = wrapper.find('input[type="text"]');

            await input.setValue('!@#$%^&*()');
            expect(wrapper.findAll('#country-list button').length).toBe(0);
        });
    });
});