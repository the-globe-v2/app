import {describe, it, expect, vi, beforeEach} from 'vitest';
import {mount, VueWrapper} from '@vue/test-utils';
import {nextTick} from 'vue';
import App from '../src/App.vue';
import CountrySelector from '../src/components/CountrySelector.vue';
import DateRangeSelector from '../src/components/DateRangeSelector.vue';
import ArticleSidePanel from '../src/components/ArticleSidePanel.vue';
import {Globe} from '../src/components/Globe';

vi.mock('../src/components/Globe', () => {
    return {
        Globe: vi.fn()
    };
});

describe('App.vue', () => {
    let wrapper: VueWrapper<any>;
    let mockGlobeInstance: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockGlobeInstance = {
            addEventListener: vi.fn(),
            findCountryByCode: vi.fn(),
            selectCountry: vi.fn(),
            deselectCountry: vi.fn(),
            updateArcs: vi.fn(),
        };
        (Globe as any).mockImplementation(() => mockGlobeInstance);

        // Mock the DOM methods
        document.getElementById = vi.fn().mockReturnValue(document.createElement('div'));
        document.querySelector = vi.fn().mockReturnValue(document.createElement('div'));

        wrapper = mount(App);
    });


    it('renders correctly', () => {
        expect(wrapper.find('#app').exists()).toBe(true);
        expect(wrapper.find('.starry-background').exists()).toBe(true);
        expect(wrapper.find('#globe-container').exists()).toBe(true);
        expect(wrapper.findComponent(CountrySelector).exists()).toBe(true);
        expect(wrapper.findComponent(DateRangeSelector).exists()).toBe(true);
        expect(wrapper.findComponent(ArticleSidePanel).exists()).toBe(true);
    });

    it('initializes with default values', () => {
        const vm = wrapper.vm as any;
        expect(vm.isSidePanelOpen).toBe(false);
        expect(vm.selectedCountry).toBe('');
        expect(vm.selectedCountryCode).toBe('');
        expect(vm.startDate).toBeDefined();
        expect(vm.endDate).toBeDefined();
        expect(new Date(vm.startDate).getTime()).toBeLessThan(new Date(vm.endDate).getTime());
    });

    it('creates stars on mount', () => {
        const starryBackground = document.querySelector('.starry-background');
        expect(starryBackground?.childElementCount).toBe(100);
        const firstStar = starryBackground?.firstElementChild as HTMLElement;
        expect(firstStar.className).toBe('star');
        expect(firstStar.style.top).toMatch(/\d+%/);
        expect(firstStar.style.left).toMatch(/\d+%/);
        expect(firstStar.style.animationDuration).toMatch(/\d+(\.\d+)?s/);
        expect(firstStar.style.animationDelay).toMatch(/\d+(\.\d+)?s/);
    });

    it('initializes Globe on mount', () => {
        expect(Globe).toHaveBeenCalledWith(expect.any(HTMLElement));
        expect(mockGlobeInstance.addEventListener).toHaveBeenCalledWith('countrySelected', expect.any(Function));
    });

    it('updates date range when DateRangeSelector emits update-date-range', async () => {
        const dateRangeSelector = wrapper.findComponent(DateRangeSelector);
        const newStartDate = '2024-03-01T00:00:00.000Z';
        const newEndDate = '2024-03-31T23:59:59.999Z';
        dateRangeSelector.vm.$emit('update-date-range', newStartDate, newEndDate);
        expect((wrapper.vm as any).startDate).toBe(newStartDate);
        expect((wrapper.vm as any).endDate).toBe(newEndDate);
    });

    it('handles country selection from CountrySelector', async () => {
        const countrySelector = wrapper.findComponent(CountrySelector);
        const mockCountry = {name: 'Germany', code: 'DE'};
        mockGlobeInstance.findCountryByCode.mockReturnValue(mockCountry);
        countrySelector.vm.$emit('country-selected', 'DE');
        expect(mockGlobeInstance.findCountryByCode).toHaveBeenCalledWith('DE');
        expect(mockGlobeInstance.selectCountry).toHaveBeenCalledWith(mockCountry);
    });

    it('opens side panel when a country is selected on the globe', async () => {
        const globeEventListener = mockGlobeInstance.addEventListener.mock.calls[0][1];
        globeEventListener({detail: {properties: {name: 'Germany', iso_a2: 'DE'}}});
        await nextTick();
        expect((wrapper.vm as any).isSidePanelOpen).toBe(true);
        expect((wrapper.vm as any).selectedCountry).toBe('Germany');
        expect((wrapper.vm as any).selectedCountryCode).toBe('DE');
    });

    it('closes side panel and deselects country', async () => {
        const vm = wrapper.vm as any;
        vm.isSidePanelOpen = true;
        vm.selectedCountry = 'Germany';
        vm.selectedCountryCode = 'DE';

        const articleSidePanel = wrapper.findComponent(ArticleSidePanel);
        articleSidePanel.vm.$emit('close');

        expect(vm.isSidePanelOpen).toBe(false);
        expect(vm.selectedCountry).toBe('');
        expect(vm.selectedCountryCode).toBe('');
        expect(mockGlobeInstance.deselectCountry).toHaveBeenCalled();
    });

    it('updates related countries on the globe', async () => {
        const vm = wrapper.vm as any;
        vm.selectedCountryCode = 'DE';
        const relatedCountries = new Map([['ES', 5], ['IT', 3]]);
        const articleSidePanel = wrapper.findComponent(ArticleSidePanel);
        articleSidePanel.vm.$emit('update-related-countries', relatedCountries, true);
        expect(mockGlobeInstance.updateArcs).toHaveBeenCalledWith('DE', relatedCountries, true);
    });


    it('handles invalid country selection', async () => {
        const countrySelector = wrapper.findComponent(CountrySelector);
        mockGlobeInstance.findCountryByCode.mockReturnValue(null);
        countrySelector.vm.$emit('country-selected', 'INVALID');
        expect(mockGlobeInstance.findCountryByCode).toHaveBeenCalledWith('INVALID');
        expect(mockGlobeInstance.selectCountry).not.toHaveBeenCalled();
        expect((wrapper.vm as any).isSidePanelOpen).toBe(false);
    });

    it('does not update related countries when no country is selected', async () => {
        const vm = wrapper.vm as any;
        vm.selectedCountryCode = '';
        const relatedCountries = new Map([['ES', 5], ['IT', 3]]);
        const articleSidePanel = wrapper.findComponent(ArticleSidePanel);
        articleSidePanel.vm.$emit('update-related-countries', relatedCountries, true);
        expect(mockGlobeInstance.updateArcs).not.toHaveBeenCalled();
    });
});