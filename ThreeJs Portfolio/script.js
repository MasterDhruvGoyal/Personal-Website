import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Declare loadedModel and state variables for rotation
let loadedModel = null;
let isSpinningFullCircle = false; // Controls if a 360-degree spin is in progress
let totalRotationToPerform = 0;   // Accumulates the remaining rotation needed
const rotationSpeed = 0.05;       // Speed of rotation per frame (radians)

// Raycaster and mouse vector for detecting clicks on 3D objects
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Ensure the script runs after the window has loaded,
// although type="module" scripts are deferred by default.
// This ensures the canvas element is available.
window.onload = function() {
    // --- Scene Setup ---
    const scene = new THREE.Scene();

    // --- Camera Setup ---
    // PerspectiveCamera(fov, aspect, near, far)
    // fov: Field of view (vertical extent of the camera's view, in degrees)
    // aspect: Aspect ratio (width divided by height)
    // near: Near clipping plane (objects closer than this won't be rendered)
    // far: Far clipping plane (objects further than this won't be rendered)
    // FOV is now 75, as it will be dynamically adjusted by camera positioning
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Initial camera position can be arbitrary, will be adjusted after model load
    camera.position.set(0, 0, 1); // Start close to origin, will be adjusted
    camera.lookAt(0, 0, 0); // Ensure the camera is looking at the center of the scene

    // --- Renderer Setup ---
    const canvas = document.getElementById('gltfCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true }); // Added alpha: true for transparency
    // Set initial size based on the parent container's dimensions
    const modelContainer = document.getElementById('model-container');

    // --- Debugging: Log container and canvas dimensions ---
    console.log('Model container clientWidth:', modelContainer.clientWidth);
    console.log('Model container clientHeight:', modelContainer.clientHeight);
    console.log('Canvas element:', canvas);

    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    renderer.setClearColor(0xffffff, 0); // Set background color to transparent (0 alpha)
    renderer.setPixelRatio(window.devicePixelRatio); // Handle high-DPI screens

    // --- Lighting Setup ---
    // Add ambient light to illuminate all objects equally
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light, intensity 2
    scene.add(ambientLight);

    // Add directional light for shadows and more realistic lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light, intensity 1
    directionalLight.position.set(5, 5, 5).normalize(); // Position the light
    scene.add(directionalLight);

    // --- GLTF Model Loading ---
    // GLTFLoader is now globally available because it's loaded via a <script> tag in the head
    const loader = new GLTFLoader();

    // Path to your model.gltf in the public folder
    const modelPath = '/model.gltf'; // Correct path for Vite's public folder
    console.log('Attempting to load model from:', modelPath); // Debugging: Confirm path being used

    loader.load(
        modelPath,
        function (gltf) {
            // Add the loaded model to the scene
            scene.add(gltf.scene);
            loadedModel = gltf.scene; // Store the loaded model's scene for animation

            // --- Centering and Sizing the model dynamically ---
            const box = new THREE.Box3().setFromObject(loadedModel);
            const center = new THREE.Vector3();
            box.getCenter(center);
            loadedModel.position.sub(center); // Center the model's pivot at (0,0,0)

            const size = new THREE.Vector3();
            box.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180); // Convert FOV to radians
            let cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2)); // Calculate Z distance to fit model
            cameraZ *= 1.2; // Add some padding for better view

            camera.position.z = cameraZ;
            camera.far = cameraZ + maxDim; // Adjust far clipping plane
            camera.updateProjectionMatrix(); // Update camera with new settings

            console.log('Model loaded successfully and dynamically sized/positioned:', gltf);
            console.log('Calculated Camera Z:', cameraZ);
            console.log('Calculated Camera Far:', camera.far);
        },
        function (xhr) {
            // Called while loading is progressing
            console.log((xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded'); // More precise percentage
        },
        function (error) {
            // Called when loading encounters an error
            console.error('An error occurred while loading the model:', error);
            console.error('Possible reasons: Incorrect modelPath, network error, or invalid GLTF file.');
        }
    );

    // --- Click Event Listener for Rotation Toggle ---
    canvas.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        let intersects = [];
        if (loadedModel) {
            intersects = raycaster.intersectObjects(loadedModel.children, true);
        }

        if (intersects.length > 0) {
            // If the model was clicked and a full spin is not already in progress
            if (!isSpinningFullCircle) {
                isSpinningFullCircle = true;
                totalRotationToPerform = Math.PI * 2; // Set 360 degrees (2 * PI radians)
                console.log('Model clicked! Starting 360-degree spin.');
            } else {
                console.log('Model clicked while spinning. Waiting for current spin to finish.');
            }
        } else {
            console.log('Clicked outside the model.');
        }
    });

    // --- Animation Loop ---
    function animate() {
        requestAnimationFrame(animate); // Request the next frame

        // Perform rotation if a full circle spin is in progress
        if (loadedModel && isSpinningFullCircle) {
            const rotationStep = Math.min(rotationSpeed, totalRotationToPerform);
            loadedModel.rotation.y += rotationStep;
            totalRotationToPerform -= rotationStep;

            // Stop spinning if the target rotation has been reached
            if (totalRotationToPerform <= 0) {
                isSpinningFullCircle = false;
                console.log('360-degree spin completed.');
            }
        }

        renderer.render(scene, camera); // Render the scene with the camera
    }

    // Start the animation loop
    animate();

    // --- Handle Window Resizing ---
    window.addEventListener('resize', () => {
        // Get the new dimensions of the model container
        const newWidth = modelContainer.clientWidth;
        const newHeight = modelContainer.clientHeight;

        // Update camera aspect ratio
        camera.aspect = newWidth / newHeight;
        camera.updateProjectionMatrix(); // Recalculate projection matrix

        // Update renderer size
        renderer.setSize(newWidth, newHeight);
        renderer.setPixelRatio(window.devicePixelRatio); // Re-set pixel ratio on resize
    });
};