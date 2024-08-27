import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

export class Globe {
    private globe!: ThreeGlobe;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private container: HTMLElement;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;

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
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 5));
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

        this.initialize().catch(console.error);

        this.addLights();
        window.addEventListener('resize', this.onWindowResize.bind(this));
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
            const countries = await response.json();

            this.globe = new ThreeGlobe()
                .globeImageUrl('/src/assets/white.png')
                .polygonsData(countries.features)
                .polygonCapColor(() => "rgba(133, 166, 212, 0.8)")
                .polygonSideColor(() => "rgba(0, 0, 0, 0)") // Transparent sides
                .polygonStrokeColor(() => '#9e9e9e') // Light gray borders
                .polygonAltitude(() => 0.01); // Flat polygons

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
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;

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
}