"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * Campo de puntos ondulante en la paleta VIVO (verde→teal sobre navy).
 * Solo para superficies de marca (sign-in) — nunca en pantallas de trabajo.
 * Con prefers-reduced-motion pinta un único frame estático.
 */
export default function BrandScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.set(0, 4.5, 9);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const COLS = 90;
    const ROWS = 50;
    const positions = new Float32Array(COLS * ROWS * 3);
    const colors = new Float32Array(COLS * ROWS * 3);
    const green = new THREE.Color("#04d98b");
    const teal = new THREE.Color("#0790a8");
    for (let i = 0; i < COLS; i++) {
      for (let j = 0; j < ROWS; j++) {
        const k = (i * ROWS + j) * 3;
        positions[k] = (i / (COLS - 1) - 0.5) * 22;
        positions[k + 1] = 0;
        positions[k + 2] = (j / (ROWS - 1) - 0.5) * 12;
        const c = green.clone().lerp(teal, i / (COLS - 1));
        colors[k] = c.r;
        colors[k + 1] = c.g;
        colors[k + 2] = c.b;
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
    });
    scene.add(new THREE.Points(geometry, material));

    function wave(time: number) {
      const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < COLS; i++) {
        for (let j = 0; j < ROWS; j++) {
          const idx = i * ROWS + j;
          const x = pos.getX(idx);
          const z = pos.getZ(idx);
          pos.setY(
            idx,
            Math.sin(x * 0.55 + time) * 0.5 +
              Math.cos(z * 0.7 + time * 0.8) * 0.35,
          );
        }
      }
      pos.needsUpdate = true;
    }

    function resize() {
      const { clientWidth, clientHeight } = mount!;
      renderer.setSize(clientWidth, clientHeight);
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    if (reduced) {
      wave(1.2);
      renderer.render(scene, camera);
    } else {
      const start = performance.now();
      const tick = () => {
        wave((performance.now() - start) / 1600);
        renderer.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} aria-hidden className="absolute inset-0" />;
}
