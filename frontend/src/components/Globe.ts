import * as THREE from 'three';
import gsap from 'gsap';
import ThreeGlobe from 'three-globe';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {point} from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

export class Globe {
    private globe!: ThreeGlobe;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private readonly renderer: THREE.WebGLRenderer;
    private readonly controls: OrbitControls;
    private readonly raycaster: THREE.Raycaster = new THREE.Raycaster();
    private readonly mouse: THREE.Vector2 = new THREE.Vector2();
    private readonly lastMousePosition: THREE.Vector2 = new THREE.Vector2();
    private countriesGeoJson: any;
    private currentlySelectedCountry: any = null;
    private isDragging = false;
    private eventTarget: EventTarget;
    private arcs: any[] = [];

    private readonly initialCountryAltitude = 0.009;
    private readonly selectedCountryAltitude = 0.02;
    private readonly initialCountryColor = 'rgba(194,195,205, 1)';
    private readonly selectedCountryColor = 'rgba(87,111,148,0.9)';
    private readonly initialCountrySideColor = 'rgba(240, 240, 240, 0)';
    private readonly selectedCountrySideColor = 'rgb(43,88,149)';
    private readonly initialCountryBorderColor = 'rgba(91,103,120,0.15)';
    private readonly initialOceanColor = 'rgb(1,48,108)';
    private readonly countryArcColor = 'rgba(240,240,240, 0.8)';
    private readonly articleArcColor = 'rgba(240,240,240, 0.5)';


    /**
     * Creates a new Globe instance and initializes the Three.js scene.
     *
     * @param {HTMLElement} container - The container element to append the globe to.
     */
    constructor(private container: HTMLElement) {
        this.eventTarget = new EventTarget();
        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.controls = this.createControls();

        container.appendChild(this.renderer.domElement);
        this.initialize().catch(console.error);
        this.animateCameraZoomIn();
        this.addEventListeners();
        this.animate();
    }

    /**
     * Creates the Three.js scene and sets the background color.
     */
    private createScene(): THREE.Scene {
        return new THREE.Scene();
    }

    /**
     * Creates the camera and positions it at a default distance from the globe.
     *
     * @returns {THREE.PerspectiveCamera} The configured camera instance.
     */
    private createCamera(): THREE.PerspectiveCamera {
        const {clientWidth, clientHeight} = this.container;
        const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);

        // Start the camera far away and slightly above the globe
        camera.position.z = 10000;
        camera.position.y = 2500;
        return camera;
    }

    private animateCameraZoomIn(): void {
        // Define the target position for the camera
        const targetZ = 200;
        this.controls.enabled = false;

        // Animate the camera's z-position to the target position
        gsap.to(this.camera.position, {
            duration: 3, // Duration of the zoom-in animation (3 seconds in this case)
            z: targetZ,
            ease: 'power2.inOut', // Easing function for smooth animation
            onUpdate: () => {
                // Ensure the camera keeps looking at the globe's center during the animation
                this.camera.lookAt(new THREE.Vector3(0, 0, 0));
            },
            onComplete: () => {
                // Ensure controls are enabled and correctly updated after the animation
                this.controls.enabled = true;
                this.controls.update();
            }
        });
    }

    /**
     * Creates the WebGL renderer and configures it with antialiasing and high performance.
     *
     * @returns {THREE.WebGLRenderer} The configured renderer instance.
     */
    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setClearColor(0x000000, 0);

        return renderer;
    }

    /**
     * Sets up the orbit controls to allow for smooth camera movement around the globe.
     *
     * @returns {OrbitControls} The configured OrbitControls instance.
     */
    private createControls(): OrbitControls {
        const controls = new OrbitControls(this.camera, this.renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.rotateSpeed = 0.4;
        controls.minDistance = 150;
        controls.maxDistance = 500;
        controls.enableZoom = true;
        controls.enablePan = false;
        return controls;
    }

    /**
     * Initializes the globe by loading GeoJSON data and adding lights to the scene.
     *
     * @returns {Promise<void>} A promise that resolves when the globe is ready.
     */
    private async initialize(): Promise<void> {
        // Preload the globe but don't add it to the scene yet
        await this.loadGeoJsonData();
        this.addLights();

        // Hide the globe initially
        this.renderer.domElement.style.visibility = 'hidden';

        // Wait for a short duration to ensure the globe is loaded
        setTimeout(() => {
            // Show the globe and start the animation
            this.renderer.domElement.style.visibility = 'visible';
        }, 800); // Adjust delay as needed
    }

    /**
     * Fetches the GeoJSON data, initializes the globe with country polygons, and adds it to the scene.
     *
     * @returns {Promise<void>} A promise that resolves when the GeoJSON data is loaded.
     */
    private async loadGeoJsonData(): Promise<void> {
        try {
            const response = await fetch('/src/assets/countries.geojson');
            if (!response.ok) console.error(`Failed to load GeoJSON: ${response.statusText}`);

            this.countriesGeoJson = await response.json();
            this.globe = this.createGlobe();
            this.globe.showAtmosphere(true);
            this.globe.atmosphereColor("rgb(240, 240, 240)");
            this.globe.atmosphereAltitude(0.15);
            this.scene.add(this.globe);
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
        }
    }

    /**
     * Creates the ThreeGlobe instance and configures its visual properties.
     */
    private createGlobe(): ThreeGlobe {
        return new ThreeGlobe({animateIn: false, waitForGlobeReady: false})
            .polygonsData(this.countriesGeoJson.features)
            .polygonCapColor(() => this.initialCountryColor) // Landmass color
            .polygonSideColor(() => this.initialCountrySideColor)  // Color of the sides of the elevation
            .polygonStrokeColor(() => this.initialCountryBorderColor)  // Border color (invisible atm)
            .polygonAltitude(() => this.initialCountryAltitude) // Initial altitude of land polygons
            .globeMaterial(new THREE.MeshPhongMaterial({color: this.initialOceanColor})); // Ocean color
    }

    /**
     * Adds ambient and directional lights to the scene for better visibility.
     */
    private addLights(): void {
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(1, 2, 1);

        this.scene.add(ambientLight, directionalLight);
    }

    /**
     * Updates the arcs on the globe to represent relationships between countries.
     * This is triggered whenever a new country is selected.
     *
     * @param fromCountry - The ISO 3166-1 alpha-2 country code of the country being selected.
     * @param relatedCountries - A map of related country codes and the number of mentions.
     * @param isArticle - Whether the arcs are for a country or just an article.
     */
    public updateArcs(fromCountry: string, relatedCountries: Map<string, number>, isArticle: boolean): void {
        // Clear previous arcs
        this.arcs = [];

        const fromCoords = this.getCountryCentroid(this.findCountryByCode(fromCountry));
        if (!fromCoords) return;

        relatedCountries.forEach((mentions, toCountry) => {
            const toCoords = this.getCountryCentroid(this.findCountryByCode(toCountry));
            if (toCoords) {
                const distance = this.calculateDistance(fromCoords, toCoords);
                this.arcs.push({
                    startLat: fromCoords.lat,
                    startLng: fromCoords.lng,
                    endLat: toCoords.lat,
                    endLng: toCoords.lng,
                    altitude: this.getArcAltitude(distance),
                    stroke: isArticle ? 0.2 : this.getArcStroke(mentions)
                });
            }
        });

        this.globe
            .arcsData(this.arcs)
            .arcColor(() => isArticle ? this.articleArcColor : this.countryArcColor)
            .arcAltitude('altitude')
            .arcStroke('stroke')
            .arcDashLength(0.9)
            .arcDashGap(0.5)
            .arcDashAnimateTime(4000);
    }


    /**
     * Binds the necessary event listeners for user interaction.
     */
    private addEventListeners(): void {
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('click', this.onClick.bind(this));
    }

    /**
     * Starts the rendering loop, continuously updating the scene and controls.
     */
    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * Adjusts the camera and renderer when the window is resized to maintain aspect ratio.
     */
    private onWindowResize(): void {
        const {clientWidth, clientHeight} = this.container;
        this.camera.aspect = clientWidth / clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(clientWidth, clientHeight);
    }

    /**
     * Tracks mouse movement, updating the raycasting coordinates and detecting dragging.
     *
     * @param event - The mousemove event.
     */
    private onMouseMove(event: MouseEvent): void {
        this.mouse.set(
            (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1,
            -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1
        );

        if (event.buttons === 1) this.isDragging = true;
    }

    /**
     * Records the mouse position when the mouse button is pressed down.
     */
    private onMouseDown(): void {
        this.lastMousePosition.copy(this.mouse);
    }

    /**
     * Checks if the mouse has moved significantly on mouse up to determine if dragging occurred.
     */
    private onMouseUp(): void {
        if (this.lastMousePosition.distanceTo(this.mouse) < 0.01) this.isDragging = false;
    }

    /**
     * Handles click events, determining if a country was clicked on and managing selection logic.
     */
    private onClick(): void {
        if (this.isDragging) return;

        this.raycaster.setFromCamera(this.mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.globe, true);

        if (intersects.length > 0) {
            const intersectedPoint = intersects[0].point;
            const geoCoords = this.globe.toGeoCoords(intersectedPoint);
            const clickedCountry = this.findCountryByCoordinates(geoCoords);

            if (clickedCountry === this.currentlySelectedCountry) {
                this.deselectCountry();
            } else if (clickedCountry) {
                this.selectCountry(clickedCountry);
                this.centerCameraOnCountry(clickedCountry);
            }
        }
    }

    /**
     * Selects a country, updating the globe's appearance to highlight it.
     */
    private selectCountry(country: any): void {
        this.currentlySelectedCountry = country;
        gsap.to(this.globe, {
            duration: 0.1,
            onUpdate: () => {
                this.updateGlobeColors();
            },
            onComplete: () => {
                // Emit a 'countrySelected' event with the selected country's name
                const event = new CustomEvent('countrySelected', {detail: country});
                this.eventTarget.dispatchEvent(event);
            }
        });
    }

    /**
     * Deselects the currently selected country, resetting the globe's appearance.
     */
    public deselectCountry(): void {
        this.currentlySelectedCountry = null;
        this.clearArcs();
        gsap.to(this.globe, {
            duration: 0.1,
            onUpdate: () => {
                this.updateGlobeColors();
            },
        });
    }

    /**
     * Clears all arcs from the globe.
     */
    private clearArcs(): void {
        this.arcs = [];
        this.globe.arcsData([]);
    }


    /**
     * Updates the visual properties of the polygons on the globe based on the currently selected country.
     */
    private updateGlobeColors(): void {
        this.globe.polygonsData(this.countriesGeoJson.features)
            .polygonAltitude((feature) => {
                return feature === this.currentlySelectedCountry ? this.selectedCountryAltitude : this.initialCountryAltitude;
            })
            .polygonCapColor((feature) => {
                return feature === this.currentlySelectedCountry ? this.selectedCountryColor : this.initialCountryColor;
            })
            .polygonSideColor((feature) => {
                return feature === this.currentlySelectedCountry ? this.selectedCountrySideColor : this.initialCountrySideColor;
            });
    }

    /**
     * Centers the camera on the selected country, animating the transition.
     *
     * @param country - The GeoJSON feature of the country to center on.
     */
    private centerCameraOnCountry(country: any): void {
        const centroid = this.getCountryCentroid(country);
        if (!centroid) return;

        const {lat, lng} = centroid;

        // Offset the latitude by a few degrees to move the camera south
        const offsetLat = lat - 5;

        // Convert the adjusted lat/lng to Cartesian coordinates
        const targetPosition = this.globe.getCoords(offsetLat, lng);

        // Create a vector for the target position
        const targetVector = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z);

        // Calculate the direction vector from the globe center to the target position
        const direction = targetVector.clone().normalize();

        // Set the desired distance from the country to zoom in closer
        const desiredDistance = 150; // Adjust this to control zoom level

        // Calculate the new camera position by moving along the direction vector
        const newCamPosition = direction.multiplyScalar(desiredDistance);

        // Use GSAP to animate the camera position
        gsap.to(this.camera.position, {
            duration: 0.5, // Control the duration of the zoom animation
            x: newCamPosition.x,
            y: newCamPosition.y,
            z: newCamPosition.z,
            ease: 'sine.inOut', // Smoother easing for the animation
            onUpdate: () => this.camera.lookAt(new THREE.Vector3(0, 0, 0)), // Ensure the camera always looks at the globe's center
        });

        // Ensure OrbitControls continue to pivot around the globe center
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    /**
     * Calculates the centroid (geographic center) of a given country feature.
     * - Handles both `Polygon` and `MultiPolygon` geometries from the GeoJSON data.
     * - For `Polygon` geometries, the centroid is calculated as the average of the vertices' latitudes and longitudes.
     * - For `MultiPolygon` geometries, it calculates the centroid based on the largest polygon by area.
     *
     * @param {any} country - The GeoJSON feature representing the country.
     * @returns {{ lat: number, lng: number } | null} - The centroid's latitude and longitude or `null` if unsupported.
     */
    private getCountryCentroid(country: any): { lat: number, lng: number } | null {
        if (!country || !country.geometry) return null;

        const {type, coordinates} = country.geometry;
        let coords: number[][] = [];

        if (type === 'Polygon') {
            coords = coordinates[0];
        } else if (type === 'MultiPolygon') {
            coords = this.getLargestPolygonCoordinates(coordinates);
        } else {
            console.error('Unsupported geometry type:', type);
            return null;
        }

        return this.calculateCentroid(coords);
    }

    /**
     * Finds the largest polygon in a MultiPolygon geometry and returns its coordinates.
     *
     * @param multiPolygonCoords - The coordinates of the MultiPolygon.
     * @returns The coordinates of the largest polygon.
     */
    private getLargestPolygonCoordinates(multiPolygonCoords: [number, number][][][]): [number, number][] {
        return multiPolygonCoords.reduce((largest, polygon) => {
            const area = Math.abs(polygon[0].reduce((acc, [x1, y1], i, arr) => {
                const [x2, y2] = arr[(i + 1) % arr.length];
                return acc + (x1 * y2 - x2 * y1);
            }, 0) / 2);

            const largestArea = Math.abs(largest.reduce((acc, [x1, y1], i, arr) => {
                const [x2, y2] = arr[(i + 1) % arr.length];
                return acc + (x1 * y2 - x2 * y1);
            }, 0) / 2);

            return area > largestArea ? polygon[0] : largest;
        }, multiPolygonCoords[0][0]);
    }

    /**
     * Calculates the centroid of a polygon given its coordinates.
     *
     * @param coords - The coordinates of the polygon.
     * @returns The centroid as an object with latitude and longitude.
     */
    private calculateCentroid(coords: number[][]): { lat: number, lng: number } {
        const numCoords = coords.length;
        const [lngSum, latSum] = coords.reduce(([lngAcc, latAcc], [lng, lat]) => [lngAcc + lng, latAcc + lat], [0, 0]);

        return {
            lat: latSum / numCoords,
            lng: lngSum / numCoords,
        };
    }

    /**
     * Finds a country by checking if the given coordinates fall within its boundaries.
     *
     * @param coords - The latitude and longitude to check.
     * @returns The GeoJSON feature of the country or `null` if not found.
     */
    private findCountryByCoordinates(coords: { lat: number, lng: number }): any | null {
        const pointToCheck = point([coords.lng, coords.lat]);

        return this.countriesGeoJson.features.find((feature: any) =>
            booleanPointInPolygon(pointToCheck, feature)
        ) || null;
    }

    /**
     * Allows external components to listen for events emitted by the Globe instance.
     * @param {string} type - The type of event to listen for (e.g., 'countrySelected').
     * @param {EventListenerOrEventListenerObject} listener - The callback function to execute when the event occurs.
     */
    public addEventListener(type: string, listener: EventListenerOrEventListenerObject): void {
        this.eventTarget.addEventListener(type, listener);
    }

    /**
     * Finds a country in the GeoJSON data by its ISO 3166-1 alpha-2 country code.
     * @param {string} countryCode - The two-letter country code to search for.
     * @returns {object | null} The country feature object if found, or null if not found.
     */
    private findCountryByCode(countryCode: string): any | null {
        return this.countriesGeoJson.features.find((feature: any) =>
            feature.properties.iso_a2 === countryCode
        ) || null;
    }

    /**
     * Calculates the altitude of an arc based on the distance between two points.
     * @param {number} distance - The distance between two points in kilometers.
     * @returns {number} The calculated altitude for the arc.
     */
    private getArcAltitude(distance: number): number {
        const minAltitude = 0.01;
        const maxAltitude = 0.6;
        const maxDistance = 20000;

        return minAltitude + (maxAltitude - minAltitude) * Math.min(distance / maxDistance, 1);
    }

    /**
     * Determines the stroke width of an arc based on the number of mentions.
     * @param {number} mentions - The number of times a country is mentioned.
     * @returns {number} The calculated stroke width for the arc.
     */
    private getArcStroke(mentions: number): number {
        const minStroke = 0.1;
        const maxStroke = 2.3;
        const maxMentions = 50;

        return minStroke + (maxStroke - minStroke) * Math.min(mentions / maxMentions, 1);
    }

    /**
     * Calculates the great-circle distance between two points on the Earth's surface.
     * @param {object} coords1 - The latitude and longitude of the first point.
     * @param {object} coords2 - The latitude and longitude of the second point.
     * @returns {number} The distance between the two points in kilometers.
     */
    private calculateDistance(coords1: { lat: number, lng: number }, coords2: { lat: number, lng: number }): number {
        const R = 6371; // Earth's radius in km
        const dLat = this.deg2rad(coords2.lat - coords1.lat);
        const dLon = this.deg2rad(coords2.lng - coords1.lng);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(coords1.lat)) * Math.cos(this.deg2rad(coords2.lat)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    /**
     * Converts degrees to radians.
     * @param {number} deg - The angle in degrees.
     * @returns {number} The angle in radians.
     */
    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }
}