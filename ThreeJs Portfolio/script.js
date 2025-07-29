import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Declare loadedModel and isRotating globally within this module
let loadedModel = null;
let isRotating = false;

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
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    // Adjusted camera position: Z-axis set to 300 for a large model
    camera.position.set(0, 1.5, 300); // X, Y, Z coordinates
    camera.lookAt(0, 0, 0); // Ensure the camera is looking at the center of the scene

    // --- Renderer Setup ---
    const canvas = document.getElementById('gltfCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    // Set initial size based on the parent container's dimensions
    const modelContainer = document.getElementById('model-container');
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
    renderer.setClearColor(0xffffff); // Set background color to white (hexadecimal)
    renderer.setPixelRatio(window.devicePixelRatio); // Handle high-DPI screens

    // Append the renderer's DOM element to the model container
    // This is optional if the canvas is already in HTML, but good for dynamic creation
    // modelContainer.appendChild(renderer.domElement); // Not needed if canvas is already in HTML

    // --- Lighting Setup ---
    // Add ambient light to illuminate all objects equally
    const ambientLight = new THREE.AmbientLight(0x404040, 2); // Soft white light, intensity 2
    scene.add(ambientLight);

    // Add directional light for shadows and more realistic lighting
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light, intensity 1
    directionalLight.position.set(5, 5, 5).normalize(); // Position the light
    scene.add(directionalLight);

    // --- GLTF Model Loading ---
    const loader = new GLTFLoader();

    // Path to your model.gltf in the public folder
    const modelPath = '/model.gltf'; // Correct path for Vite's public folder

    loader.load(
        modelPath,
        function (gltf) {
            // Add the loaded model to the scene
            scene.add(gltf.scene);
            loadedModel = gltf.scene; // Store the loaded model's scene for animation

            // Optional: You might need to adjust the model's initial position or scale
            // if it's too large or not centered in your imported GLTF file.
            // For example, to make it smaller and move it down slightly:
            // loadedModel.scale.set(0.5, 0.5, 0.5);
            // loadedModel.position.set(0, -0.5, 0);

            console.log('Model loaded successfully:', gltf);
        },
        function (xhr) {
            // Called while loading is progressing
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        function (error) {
            // Called when loading encounters an error
            console.error('An error occurred while loading the model:', error);
        }
    );

    // --- Click Event Listener for Rotation Toggle ---
    canvas.addEventListener('click', (event) => {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        // event.clientX/Y are screen coordinates, we need them relative to the canvas
        const rect = canvas.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // Update the picking ray with the camera and mouse position
        raycaster.setFromCamera(mouse, camera);

        // Calculate objects intersecting the picking ray
        // We intersect with all children of the loaded model recursively.
        let intersects = [];
        if (loadedModel) {
            intersects = raycaster.intersectObjects(loadedModel.children, true);
        }

        if (intersects.length > 0) {
            // If there's an intersection, it means the model was clicked
            isRotating = !isRotating; // Toggle the rotation state
            console.log('Model clicked! Rotation toggled:', isRotating);
        } else {
            console.log('Clicked outside the model.');
        }
    });

    // --- Animation Loop ---
    function animate() {
        requestAnimationFrame(animate); // Request the next frame

        // Rotate the loaded model only if isRotating is true
        if (loadedModel && isRotating) {
            loadedModel.rotation.y += 0.01; // Adjust this value for faster/slower rotation
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
