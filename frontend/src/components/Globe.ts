import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import countries from '../assets/countries.geojson';

export class Globe {
    private readonly globe: ThreeGlobe;
    private readonly scene: THREE.Scene;
    private readonly camera: THREE.PerspectiveCamera;
    private container: HTMLElement;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;

    constructor(container: HTMLElement) {
        this.container = container;
        this.scene = new THREE.Scene();

        // Set background color to white
        this.scene.background = new THREE.Color(0xffffff);

        this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, // Enable antialiasing
            powerPreference: 'high-performance', // Optimize performance
        });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 5)); // Limit pixel ratio to 5 for decent performance
        container.appendChild(this.renderer.domElement);

        this.camera.position.z = 250;

        // Initialize OrbitControls for globe movement
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true; // Smooth the movement
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.minDistance = 150;
        this.controls.maxDistance = 500;

        // Initialize the globe
        this.globe = new ThreeGlobe()
            .globeImageUrl('/src/assets/earth-blue-marble-10k.jpg')
            .bumpImageUrl('/src/assets/earth-topology.png')
            .polygonsData(countries.features)
            .polygonCapColor(() => 'rgba(200, 0, 0, 0.3)')
            .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
            .polygonStrokeColor(() => '#111');

        this.globe.atmosphereColor('#b0c4de'); // Light blue-gray atmosphere
        this.globe.atmosphereAltitude(0.35); // Increase the altitude for a softer atmosphere look

        this.scene.add(this.globe);
        this.addLights();

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.animate();
    }

    private addLights() {
        // Adjust ambient light intensity
        const ambientLight = new THREE.AmbientLight(0xffffff, 2.5);
        this.scene.add(ambientLight);

        // Add directional light for shadow casting
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(1, 2, 1); // Position the light to create interesting shadows
        directionalLight.castShadow = true; // Enable shadows for this light

        // Configure shadow properties
        directionalLight.shadow.mapSize.width = 2048; // Increase shadow map size for better quality
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5; // Adjust the shadow camera frustum
        directionalLight.shadow.camera.far = 500;

        this.scene.add(directionalLight);
    }

    private animate() {
        requestAnimationFrame(this.animate.bind(this));

        // Update controls in each animation frame
        this.controls.update();

        this.renderer.render(this.scene, this.camera);
    }

    private onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}