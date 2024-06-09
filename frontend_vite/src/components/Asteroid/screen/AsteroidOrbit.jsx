import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getOrbitalPosition } from './getOrbitalPosition';
import { orbitalData } from './OrbitalData';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { useWebSocket } from '../../../context/WebSocketContext';
import { useParams } from 'react-router-dom';

const SCALE_FACTOR = 1e-7; // Adjusted scale factor
const PLANET_SIZE = 1; // Base size for planets

const AsteroidOrbit = () => {
    const { asteroidId } = useParams();
    const selectedAsteroId = asteroidId;
    // Rest of your code...

    // const selectedAsteroId = null;
    const mountRef = useRef(null);
    const asteroidRef = useRef(null);
    const labelsRef = useRef([]);
    const pivotRef = useRef(new THREE.Object3D()); // Pivot point for rotation
    const [scene, setScene] = useState(null);
    const [camera, setCamera] = useState(null);
    const [renderer, setRenderer] = useState(null);
    const [controls, setControls] = useState(null);

    const { sendMessage, addMessageHandler } = useWebSocket();

    useEffect(() => {
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x000000); // Set background color

        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 100000); // Increased far plane
        camera.position.set(0, -25, 30);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.enableRotate = false; // Disable default rotation

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xffffff, 1, 0);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        const axesHelper = new THREE.AxesHelper(100);
        scene.add(axesHelper);

        // Add pivot to the scene
        scene.add(pivotRef.current);

        // Create Sun
        const sunGeometry = new THREE.SphereGeometry(PLANET_SIZE, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: orbitalData.Sun.color });
        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        pivotRef.current.add(sunMesh); // Add Sun to the pivot

        const createOrbit = (semiMajorAxis, eccentricity, inclination, omega, Omega, color, segments = 1000) => {
            const points = [];
            const a = semiMajorAxis; // semi-major axis
            const e = eccentricity; // eccentricity
            const i = THREE.MathUtils.degToRad(inclination); // Convert inclination to radians
            const w = THREE.MathUtils.degToRad(omega); // argument of periapsis in radians
            const N = THREE.MathUtils.degToRad(Omega); // longitude of ascending node in radians

            for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / segments) {
                const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
                const x = r * (Math.cos(N) * Math.cos(theta + w) - Math.sin(N) * Math.sin(theta + w) * Math.cos(i));
                const y = r * (Math.sin(N) * Math.cos(theta + w) + Math.cos(N) * Math.sin(theta + w) * Math.cos(i));
                const z = r * Math.sin(i) * Math.sin(theta + w);
                points.push(new THREE.Vector3(x * 15, y * 15, z * 15));
            }

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({ color });
            return new THREE.LineLoop(geometry, material);
        };

        const createPlanet = (name, position, color, size) => {
            const geometry = new THREE.SphereGeometry(size, 22, 22);
            const material = new THREE.MeshBasicMaterial({ color });
            const planet = new THREE.Mesh(geometry, material);
            planet.position.set(position.x * SCALE_FACTOR, position.y * SCALE_FACTOR, position.z * SCALE_FACTOR);
            planet.name = name;

            // Create a sprite for the label
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            context.font = 'Bold 20px Arial';
            context.fillStyle = 'white';
            context.fillText(name, 0, 20);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(5, 2.5, 1);
            sprite.position.set(0, 1.5 * size, 0);
            planet.add(sprite);

            labelsRef.current.push(sprite);

            return planet;
        };

        Object.keys(orbitalData).forEach((key) => {
            if (key !== 'Sun') {
                const data = orbitalData[key];
                const position = getOrbitalPosition(data, new Date());
                const planet = createPlanet(key, position, data.color, PLANET_SIZE);
                const orbit = createOrbit(data.semi_major_axis, data.eccentricity, data.inclination, data.perihelion_argument, data.ascending_node_longitude, data.color);
                pivotRef.current.add(planet); // Add planet to the pivot
                pivotRef.current.add(orbit); // Add orbit to the pivot
            }
        });

        const handleAsteroidPosition = (data) => {
            if (data.type === 'asteroidPosition') {
                const { position, orbitalData } = data;
                const orbit = createOrbit(orbitalData.semi_major_axis, orbitalData.eccentricity, orbitalData.inclination, orbitalData.perihelion_argument, orbitalData.ascending_node_longitude, 0xffffff);
                if (asteroidRef.current) {
                    pivotRef.current.remove(asteroidRef.current);
                }
                const asteroid = createPlanet(data.id, position, 0xffffff, PLANET_SIZE);
                asteroidRef.current = asteroid;
                pivotRef.current.add(orbit);
                pivotRef.current.add(asteroid);
            }
        };

        addMessageHandler(handleAsteroidPosition);

        if (selectedAsteroId !== null) {
            console.log("Requesting asteroid position for:", selectedAsteroId);
            sendMessage({
                type: 'requestAsteroidPosition',
                id: selectedAsteroId
            }).catch(err => {
                console.error('WebSocket send error:', err);
            });
        }

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();

            // Update label positions to always face the camera
            labelsRef.current.forEach((label) => {
                label.lookAt(camera.position);
            });

            renderer.render(scene, camera);
        };

        animate();

        let isDragging = false;
        let previousMousePosition = {
            x: 0,
            y: 0
        };

        const onDocumentMouseDown = (event) => {
            isDragging = true;
        };

        const onDocumentMouseMove = (event) => {
            if (isDragging) {
                const deltaX = event.clientX - previousMousePosition.x;
                const deltaY = event.clientY - previousMousePosition.y;

                pivotRef.current.rotation.z += deltaX * 0.005;
                pivotRef.current.rotation.x += deltaY * 0.005;
            }
            previousMousePosition = {
                x: event.clientX,
                y: event.clientY
            };
        };

        const onDocumentMouseUp = () => {
            isDragging = false;
        };

        document.addEventListener('mousedown', onDocumentMouseDown);
        document.addEventListener('mousemove', onDocumentMouseMove);
        document.addEventListener('mouseup', onDocumentMouseUp);

        setScene(scene);
        setCamera(camera);
        setRenderer(renderer);
        setControls(controls);

        return () => {
            if (renderer) {
                mountRef.current.removeChild(renderer.domElement);
            }
            document.removeEventListener('mousedown', onDocumentMouseDown);
            document.removeEventListener('mousemove', onDocumentMouseMove);
            document.removeEventListener('mouseup', onDocumentMouseUp);
        };
    }, [addMessageHandler, sendMessage, selectedAsteroId]);

    return (
        <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
    );
};

export default AsteroidOrbit;
