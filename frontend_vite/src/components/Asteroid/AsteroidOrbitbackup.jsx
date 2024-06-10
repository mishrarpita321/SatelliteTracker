import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getOrbitalPosition } from './getOrbitalPosition';
import { orbitalData } from './OrbitalData';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { useWebSocket } from '../../context/WebSocketContext';

const SCALE_FACTOR = 1e-6; // Uniform scale factor for both orbits and positions
const PLANET_SIZE = 1; // Fixed size for planets and sun

const AsteroidOrbit = ({ selectedAsteroId }) => {
    const mountRef = useRef(null);
    const asteroidRef = useRef(null);
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
        camera.position.set(0, 200, 400);

        const renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

        const sunLight = new THREE.PointLight(0xffffff, 1, 0);
        sunLight.position.set(0, 0, 0);
        scene.add(sunLight);

        const axesHelper = new THREE.AxesHelper(100);
        scene.add(axesHelper);

        // Create Sun
        const sunGeometry = new THREE.SphereGeometry(PLANET_SIZE * 5, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: orbitalData.Sun.color });
        const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        scene.add(sunMesh);

        const createOrbit = (semiMajorAxis, eccentricity, inclination, omega, Omega, color, segments = 1000) => {
            const points = [];
            const a = semiMajorAxis * 149597870.7 * SCALE_FACTOR; // Convert AU to km, then scale down
            const e = eccentricity;
            const i = THREE.MathUtils.degToRad(inclination);
            const w = THREE.MathUtils.degToRad(omega);
            const N = THREE.MathUtils.degToRad(Omega);

            for (let theta = 0; theta < 2 * Math.PI; theta += Math.PI / segments) {
                const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
                const x = r * (Math.cos(N) * Math.cos(theta + w) - Math.sin(N) * Math.sin(theta + w) * Math.cos(i));
                const y = r * (Math.sin(N) * Math.cos(theta + w) + Math.cos(N) * Math.sin(theta + w) * Math.cos(i));
                const z = r * Math.sin(i) * Math.sin(theta + w);
                points.push(new THREE.Vector3(x, y, z));
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

            const fontLoader = new FontLoader();
            fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
                const textGeometry = new TextGeometry(name, {
                    font: font,
                    size: 0.5,
                    depth: 0.1,
                });
                const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
                const textMesh = new THREE.Mesh(textGeometry, textMaterial);
                textMesh.position.set(
                    (position.x * SCALE_FACTOR) + 0.5,
                    (position.y * SCALE_FACTOR) + 0.5,
                    position.z * SCALE_FACTOR
                );
                scene.add(textMesh);
            });

            return planet;
        };

        Object.keys(orbitalData).forEach((key) => {
            if (key !== 'Sun') {
                const data = orbitalData[key];
                const position = getOrbitalPosition(data, new Date());
                const planet = createPlanet(key, position, data.color, PLANET_SIZE);
                const orbit = createOrbit(data.semi_major_axis, data.eccentricity, data.inclination, data.perihelion_argument, data.ascending_node_longitude, data.color);
                scene.add(planet);
                scene.add(orbit);
            }
        });

        const handleAsteroidPosition = (data) => {
            if (data.type === 'asteroidPosition') {
                const { position, orbitalData } = data;
                const orbit = createOrbit(orbitalData.semi_major_axis, orbitalData.eccentricity, orbitalData.inclination, orbitalData.perihelion_argument, orbitalData.ascending_node_longitude, 0xffffff);
                if (asteroidRef.current) {
                    scene.remove(asteroidRef.current);
                }
                const asteroid = createPlanet(data.id, position, 0xffffff, PLANET_SIZE);
                asteroidRef.current = asteroid;
                scene.add(orbit);
                scene.add(asteroid);
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
            renderer.render(scene, camera);
        };

        animate();

        setScene(scene);
        setCamera(camera);
        setRenderer(renderer);
        setControls(controls);

        return () => {
            if (renderer) {
                mountRef.current.removeChild(renderer.domElement);
            }
        };
    }, [addMessageHandler, sendMessage, selectedAsteroId]);

    return (
        <div ref={mountRef} style={{ width: '100%', height: '100vh' }} />
    );
};

export default AsteroidOrbit;
