import React, { Suspense } from 'react';
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  liveUrl: string;
  sourceUrl: string;
  modelUrl?: string;
}

interface GalleryCardProps {
  project: Project;
}

function AssetModel({ url }: { url: string }) {
  const scene = useLoader(GLTFLoader, url);
  return <primitive object={scene.scene} />;
}

export default function GalleryCard({ project }: GalleryCardProps) {
  return (
    <div className="glass rounded-xl overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-white">{project.title}</h2>
        <p className="text-gray-300 mb-6">{project.description}</p>
        
        {project.modelUrl && (
          <div className="h-[320px] bg-black/30 rounded-lg overflow-hidden mb-6">
            <Canvas camera={{ position: [2, 2, 3], fov: 50 }}>
              <ambientLight intensity={0.5} />
              <Stage intensity={1} environment="city" shadows>
                <Suspense fallback={null}>
                  <AssetModel url={project.modelUrl} />
                </Suspense>
              </Stage>
              <OrbitControls enablePan enableZoom enableRotate />
            </Canvas>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mb-6">
          {project.tags.map((tag, index) => (
            <span 
              key={index}
              className="px-3 py-1 bg-accent-900/50 text-accent-200 rounded-full text-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex gap-4">
          <motion.a
            href={project.liveUrl}
            className="w-full px-6 py-2 bg-accent-600 hover:bg-accent-500 rounded-md transition-colors text-white flex items-center justify-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Live
            <ExternalLink size={16} />
          </motion.a>
        </div>
      </div>
    </div>
  );
}