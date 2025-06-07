import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import InteractiveParticles from './InteractiveParticles';

const HeroCanvas = () => {
  return (
    <div className="absolute inset-0 z-0">
      {/* Background Gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to bottom, #000000 0%, #13004d 100%)',
          zIndex: 0,
        }}
      />
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 0, 5], fov: 75 }}
        gl={{ alpha: true }}
        style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'auto' }}
      >
        <Suspense fallback={null}>
          <InteractiveParticles />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
      {/* Vignette Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-black/50 via-accent-950/30 to-black" />
    </div>
  );
};

export default HeroCanvas;
