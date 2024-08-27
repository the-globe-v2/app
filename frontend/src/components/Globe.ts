import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { point } from '@turf/helpers';
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
        this.controls.rotateSpeed = 0.5;
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