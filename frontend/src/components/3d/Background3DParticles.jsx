import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Background3DParticles
 * Subtle, ultra-lightweight ambient 3D particle & geometry field in the background.
 * Adds visual depth across all screen resolutions without interfering with UI or scroll.
 */
export default function Background3DParticles() {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check WebGL availability
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: "low-power" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 25;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // Particle cloud
    const particleCount = window.innerWidth < 768 ? 40 : 80;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 50;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 40;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
      scales[i] = Math.random() * 0.4 + 0.1;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // Particle material
    const particleMaterial = new THREE.PointsMaterial({
      color: 0x86efac, // soft emerald
      size: 0.35,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    scene.add(particles);

    // Add a few subtle floating wireframe polyhedrons
    const polyhedrons = [];
    const shapes = [
      new THREE.IcosahedronGeometry(1.2, 0),
      new THREE.OctahedronGeometry(1.4, 0),
      new THREE.TetrahedronGeometry(1.5, 0),
    ];

    const wireMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });

    for (let i = 0; i < (window.innerWidth < 768 ? 3 : 6); i++) {
      const mesh = new THREE.Mesh(shapes[i % shapes.length], wireMat);
      mesh.position.set(
        (Math.random() - 0.5) * 36,
        (Math.random() - 0.5) * 26,
        (Math.random() - 0.5) * 15 - 5
      );
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.005,
        rotY: (Math.random() - 0.5) * 0.008,
        floatSpeed: Math.random() * 0.002 + 0.001,
        initialY: mesh.position.y,
      };
      scene.add(mesh);
      polyhedrons.push(mesh);
    }

    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Slow drift
      particles.rotation.y = elapsedTime * 0.02 + mouseX * 0.1;
      particles.rotation.x = elapsedTime * 0.01 + mouseY * 0.1;

      polyhedrons.forEach((mesh) => {
        mesh.rotation.x += mesh.userData.rotX;
        mesh.rotation.y += mesh.userData.rotY;
        mesh.position.y = mesh.userData.initialY + Math.sin(elapsedTime * 0.8 + mesh.position.x) * 0.6;
      });

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
      wireMat.dispose();
      shapes.forEach((s) => s.dispose());
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-70"
      aria-hidden="true"
    />
  );
}
