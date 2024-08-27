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

    private readonly initialCountryAltitude = 0.003;
    private readonly selectedCountryAltitude = 0.02;
    private readonly initialCountryColor = 'rgba(240, 240, 240, 0.8)';
    private readonly selectedCountryColor = 'rgba(150, 190, 240, 0.9)';
    private readonly initialCountrySideColor = 'rgba(240, 240, 240, 1)';
    private readonly selectedCountrySideColor = 'rgba(240, 240, 240 ,1)';
    private readonly initialCountryBorderColor = 'rgba(0, 0, 0, 0)';
    private readonly initialOceanColor = 'rgba(0, 44, 89, 1)';


    constructor(private container: HTMLElement) {
        this.scene = this.createScene();
        this.camera = this.createCamera();
        this.renderer = this.createRenderer();
        this.controls = this.createControls();

        container.appendChild(this.renderer.domElement);
        this.initialize().catch(console.error);
        this.addEventListeners();
        this.animate();
    }

    /**
     * Creates the Three.js scene and sets the background color.
     */
    private createScene(): THREE.Scene {
        const scene = new THREE.Scene();
        scene.background = new THREE.Color("rgba(247, 247, 247, 1)");
        return scene;
    }

    /**
     * Creates the camera and positions it at a default distance from the globe.
     */
    private createCamera(): THREE.PerspectiveCamera {
        const {clientWidth, clientHeight} = this.container;
        const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 1000);
        camera.position.z = 250;
        return camera;
    }

    /**
     * Creates the WebGL renderer and configures it with antialiasing and high performance.
     */
    private createRenderer(): THREE.WebGLRenderer {
        const renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        return renderer;
    }

    /**
     * Sets up the orbit controls to allow for smooth camera movement around the globe.
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
     */
    private async initialize(): Promise<void> {
        await this.loadGeoJsonData();
        this.addLights();
    }

    /**
     * Fetches the GeoJSON data, initializes the globe with country polygons, and adds it to the scene.
     */
    private async loadGeoJsonData(): Promise<void> {
        try {
            const response = await fetch('/src/assets/countries.geojson');
            if (!response.ok) throw new Error(`Failed to load GeoJSON: ${response.statusText}`);

            this.countriesGeoJson = await response.json();
            this.globe = this.createGlobe();
            this.globe.showAtmosphere(false);
            // this.globe.atmosphereColor("rgb(0, 44, 89)");
            // this.globe.atmosphereAltitude(0.2);
            this.scene.add(this.globe);
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
        }
    }

    /**
     * Creates the ThreeGlobe instance and configures its visual properties.
     */
    private createGlobe(): ThreeGlobe {
        return new ThreeGlobe()
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
        if (this.lastMousePosition.distanceTo(this.mouse) < 0.001) this.isDragging = false;
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
     * Deselects the currently selected country, resetting the globe's appearance.
     */
    private deselectCountry(): void {
        this.currentlySelectedCountry = null;
        gsap.to(this.globe, {
            duration: 0.1,
            onUpdate: () => {
                this.updateGlobeColors();
            },
        });
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
        });
    }

    /**
     * Updates the visual properties of the polygons on the globe based on the currently selected country.
     */
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
     */
    private centerCameraOnCountry(country: any): void {
        const centroid = this.getCountryCentroid(country);
        if (!centroid) return;

        const {lat, lng} = centroid;

        // Convert the lat/lng to Cartesian coordinates
        const targetPosition = this.globe.getCoords(lat, lng);

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
        const {type, coordinates} = country.geometry;
        let coords: number[][] = [];

        if (type === 'Polygon') {
            coords = coordinates[0]; // For Polygon, take the first set of coordinates
        } else if (type === 'MultiPolygon') {
            coords = this.getLargestPolygonCoordinates(coordinates); // For MultiPolygon, find the largest polygon by area
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
}