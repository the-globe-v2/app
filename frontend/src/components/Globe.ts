import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {point} from '@turf/helpers';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import gsap from 'gsap';

export class Globe {
    private globe!: ThreeGlobe;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private container: HTMLElement;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private raycaster: THREE.Raycaster;
    private mouse: THREE.Vector2;
    private countriesGeoJson: any; // To store GeoJSON data
    private currentlySelectedCountry: any = null; // Track the currently selected country
    private isDragging: boolean = false; // Flag to detect dragging
    private lastMousePosition: THREE.Vector2;

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();

        this.scene.background = new THREE.Color(0xededed);

        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            powerPreference: 'high-performance',
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        container.appendChild(this.renderer.domElement);

        this.camera.position.z = 250;

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.4;
        this.controls.minDistance = 150;
        this.controls.maxDistance = 500;
        this.controls.enableZoom = true;
        this.controls.enablePan = false;

        // Initialize raycaster and mouse vector
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.lastMousePosition = new THREE.Vector2();

        this.initialize().catch(console.error);

        this.addLights();
        window.addEventListener('resize', this.onWindowResize.bind(this));
        window.addEventListener('mousemove', this.onMouseMove.bind(this));
        window.addEventListener('mousedown', this.onMouseDown.bind(this));
        window.addEventListener('mouseup', this.onMouseUp.bind(this));
        window.addEventListener('click', this.onClick.bind(this)); // Use click event to select a country
        this.animate();
    }

    private async initialize() {
        await this.loadGeoJsonData();
    }

    private async loadGeoJsonData() {
        try {
            const response = await fetch('/src/assets/countries.geojson');
            if (!response.ok) {
                throw new Error(`Failed to load GeoJSON: ${response.statusText}`);
            }
            this.countriesGeoJson = await response.json();

            this.globe = new ThreeGlobe()
                .polygonsData(this.countriesGeoJson.features)
                .polygonCapColor(() => "rgba(133, 166, 212, 0.8)")
                .polygonSideColor(() => "rgba(133, 166, 212, 1)") // Transparent sides
                .polygonStrokeColor(() => 'rgba(200, 160, 80, 0)') // Light gray borders
                .polygonAltitude(() => 0.005); // Flat polygons

            const material = new THREE.MeshPhongMaterial({
                color: "rgba(240, 240, 240, 1)",
            });
            this.globe.globeMaterial(material)

            this.scene.add(this.globe);
        } catch (error) {
            console.error('Error loading GeoJSON:', error);
        }
    }

    private addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(1, 2, 1);

        this.scene.add(directionalLight);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    private onMouseMove(event: MouseEvent) {
        // Update mouse coordinates (-1 to 1 range)
        this.mouse.x = (event.clientX / this.renderer.domElement.clientWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / this.renderer.domElement.clientHeight) * 2 + 1;

        if (event.buttons === 1) {
            this.isDragging = true;
        }
    }

    private onMouseDown() {
        // Record the initial mouse position
        this.lastMousePosition.set(this.mouse.x, this.mouse.y);
    }

    private onMouseUp() {
        // Check if the mouse has moved significantly
        if (this.lastMousePosition.distanceTo(this.mouse) < 0.001) {
            this.isDragging = false;
        }
    }

    private onClick() {
        if (this.isDragging) {
            this.isDragging = false;
            return; // Skip selection if the globe was dragged
        }

        // Update the raycaster with the current mouse position
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Calculate objects intersecting the raycaster
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

    private deselectCountry() {
        this.currentlySelectedCountry = null;
        gsap.to(this.globe, {
            duration: 0.1,
            onUpdate: () => {
                this.globe.polygonAltitude(this.getPolygonAltitude.bind(this));
                this.globe.polygonCapColor(this.getPolygonCapColor.bind(this));
                this.globe.polygonSideColor(this.getPolygonSideColor.bind(this));
            },
        });
    }

    private selectCountry(country: any) {
        this.currentlySelectedCountry = country;
        gsap.to(this.globe, {
            duration: 0.1,
            onUpdate: () => {
                this.globe.polygonAltitude(this.getPolygonAltitude.bind(this));
                this.globe.polygonCapColor(this.getPolygonCapColor.bind(this));
                this.globe.polygonSideColor(this.getPolygonSideColor.bind(this));
            },
        });
    }

    private centerCameraOnCountry(country: any) {
        // Get the centroid of the country
        const centroid = this.getCountryCentroid(country);


        if (centroid) {
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
                ease: "sine.inOut", // Smoother easing for the animation
                onUpdate: () => {
                    this.camera.lookAt(new THREE.Vector3(0, 0, 0)); // Ensure the camera always looks at the globe's center
                }
            });

            // Ensure OrbitControls continue to pivot around the globe center
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    /**
     * Calculates the centroid (geographic center) of a given country feature.
     *
     * The method handles both `Polygon` and `MultiPolygon` geometries from the GeoJSON data.
     *
     * - For `Polygon` geometries, the centroid is calculated as the average of the latitudes
     *   and longitudes of the polygon's vertices.
     * - For `MultiPolygon` geometries, the method selects the polygon with the largest area
     *   (typically the main landmass) and calculates the centroid based on that polygon.
     *
     * This approach ensures that for countries with disjoint territories (e.g., France with
     * both mainland and overseas regions), the centroid calculation is based on the most
     * significant landmass, avoiding incorrect centroid locations like overseas territories.
     *
     * @param {any} country - The GeoJSON feature representing the country, containing a geometry
     *                        of type `Polygon` or `MultiPolygon`.
     *
     * @returns {{ lat: number, lng: number } | null} - An object containing the latitude and
     *                                                 longitude of the centroid, or `null` if
     *                                                 the geometry type is unsupported.
     *
     * @example
     * // Assuming `country` is a GeoJSON feature for France:
     * const centroid = this.getCountryCentroid(country);
     * console.log(centroid); // { lat: 46.603354, lng: 1.888334 } (Approximate centroid for mainland France)
     */
    private getCountryCentroid(country: any): { lat: number, lng: number } | null {
        const {type, coordinates} = country.geometry;

        let coords: number[][] = [];

        if (type === 'Polygon') {
            // For Polygon, take the first set of coordinates
            coords = coordinates[0];
        } else if (type === 'MultiPolygon') {
            // For MultiPolygon, find the largest polygon by area
            let maxArea = 0;
            coordinates.forEach((polygon: number[][][]) => {
                const area = this.calculatePolygonArea(polygon[0]);
                if (area > maxArea) {
                    maxArea = area;
                    coords = polygon[0]; // Take the largest polygon's first set of coordinates
                }
            });
        } else {
            console.error('Unsupported geometry type:', type);
            return null;
        }

        // Calculate centroid of the selected polygon
        let lngSum = 0, latSum = 0;
        coords.forEach(([lng, lat]) => {
            lngSum += lng;
            latSum += lat;
        });

        const numCoords = coords.length;
        return {
            lat: latSum / numCoords,
            lng: lngSum / numCoords,
        };
    }

// Helper function to calculate the area of a polygon for centroid calculation
    private calculatePolygonArea(coords: number[][]): number {
        let area = 0;
        const numCoords = coords.length;

        for (let i = 0; i < numCoords; i++) {
            const [x1, y1] = coords[i];
            const [x2, y2] = coords[(i + 1) % numCoords];
            area += x1 * y2 - x2 * y1;
        }

        return Math.abs(area / 2);
    }

    private getPolygonAltitude(d: any): number {
        return d === this.currentlySelectedCountry ? 0.02 : 0.005;
    }

    private getPolygonCapColor(d: any): string {
        return d === this.currentlySelectedCountry ? "rgba(166,212,133,0.9)" : "rgba(133, 166, 212, 0.8)";
    }

    private getPolygonSideColor(d: any): string {
        return d === this.currentlySelectedCountry ? "rgba(149,190,119,1)" : "rgba(133, 166, 212, 1)";
    }

    private findCountryByCoordinates(coords: { lat: number, lng: number }): any | null {
        const pointToCheck = point([coords.lng, coords.lat]);

        for (const feature of this.countriesGeoJson.features) {
            if (booleanPointInPolygon(pointToCheck, feature)) {
                return feature; // Return the whole feature object
            }
        }

        return null; // If no country was found
    }
}