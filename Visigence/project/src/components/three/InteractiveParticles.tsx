import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { Points, PointMaterial } from '@react-three/drei';

// Configuration constants for better maintainability
const PARTICLE_COUNT = 5000;
const ANIMATION_SPEED = {
  rotation: { x: 0.05, y: 0.075 },
  movement: { base: 0.01, variation: 0.7 },
  attraction: 0.02,
  repulsion: 0.03
};

const COLOR_RANGE = {
  r: { base: 0.5, variation: 0.3 },
  g: { base: 0.2, variation: 0.2 },
  b: { base: 0.8, variation: 0.2 }
};

/**
 * Interactive particle system component with optimized performance
 * Creates a dynamic 3D particle field that responds to mouse movement
 */
const InteractiveParticles: React.FC = () => {
  const { viewport, mouse } = useThree();
  const ref = useRef<THREE.Points>(null);

  // Memoized particle data generation for better performance
  const { positions, colors, initialPositions } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const initialPositions = new Float32Array(PARTICLE_COUNT * 3);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // Generate random positions in a 10x10x10 box with better distribution
      const x = (Math.random() - 0.5) * 10;
      const y = (Math.random() - 0.5) * 10;
      const z = (Math.random() - 0.5) * 10;
      
      // Store both current and initial positions
      positions[i3] = initialPositions[i3] = x;
      positions[i3 + 1] = initialPositions[i3 + 1] = y;
      positions[i3 + 2] = initialPositions[i3 + 2] = z;
      
      // Generate blue-purple color palette with variation
      colors[i3] = COLOR_RANGE.r.base + Math.random() * COLOR_RANGE.r.variation;
      colors[i3 + 1] = COLOR_RANGE.g.base + Math.random() * COLOR_RANGE.g.variation;
      colors[i3 + 2] = COLOR_RANGE.b.base + Math.random() * COLOR_RANGE.b.variation;
    }
    
    return { positions, colors, initialPositions };
  }, []);

  // Memoized time offsets for individual particle movement patterns
  const timeOffsets = useMemo(() => {
    const arr = new Float32Array(PARTICLE_COUNT);
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      arr[i] = Math.random() * Math.PI * 2;
    }
    return arr;
  }, []);

  // Main animation loop with optimized calculations
  useFrame((state, delta) => {
    if (!ref.current?.geometry?.attributes?.position) return;

    // Update rotation for the entire particle system
    if (ref.current) {
      ref.current.rotation.x += delta * ANIMATION_SPEED.rotation.x;
      ref.current.rotation.y += delta * ANIMATION_SPEED.rotation.y;
    }

    const pos = ref.current.geometry.attributes.position.array as Float32Array;
    const t = state.clock.elapsedTime;
    
    // Convert mouse position to world coordinates
    const mouseX = (mouse.x * viewport.width) / 2;
    const mouseY = (mouse.y * viewport.height) / 2;

    // Update each particle position with physics-like behavior
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const x = pos[i3];
      const y = pos[i3 + 1];
      const z = pos[i3 + 2];
      
      // Calculate distance to mouse for interaction
      const dx = x - mouseX;
      const dy = y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Apply attraction force towards original position (spring-like behavior)
      const fx = (initialPositions[i3] - x) * ANIMATION_SPEED.attraction;
      const fy = (initialPositions[i3 + 1] - y) * ANIMATION_SPEED.attraction;
      const fz = (initialPositions[i3 + 2] - z) * ANIMATION_SPEED.attraction;

      // Add individual particle movement with unique time offset
      const offset = timeOffsets[i];
      const ix = Math.sin(t + offset) * ANIMATION_SPEED.movement.base;
      const iy = Math.cos(t + offset * 1.3) * ANIMATION_SPEED.movement.base;
      const iz = Math.sin(t * ANIMATION_SPEED.movement.variation + offset) * ANIMATION_SPEED.movement.base;

      // Apply mouse repulsion when cursor is nearby
      if (dist < 2) {
        pos[i3] += dx * ANIMATION_SPEED.repulsion;
        pos[i3 + 1] += dy * ANIMATION_SPEED.repulsion;
      } else {
        // Normal movement: attraction to home + individual motion
        pos[i3] += fx + ix;
        pos[i3 + 1] += fy + iy;
        pos[i3 + 2] += fz + iz;
      }
    }
    
    // Mark geometry for update
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        transparent
        vertexColors
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
};

export default InteractiveParticles;