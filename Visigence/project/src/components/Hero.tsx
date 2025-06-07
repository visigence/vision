import React from 'react';
import { motion } from 'framer-motion';
import HeroCanvas from './three/HeroCanvas';
import { ArrowRight } from 'lucide-react';

const Hero: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  return (
    <section 
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      aria-label="Hero section"
    >
      {/* Background Canvas */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <HeroCanvas />
      </div>

      {/* Content */}
      <motion.div 
        className="container mx-auto px-6 z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.div 
            className="mb-8"
            variants={itemVariants}
          >
            <h1 className="font-orbitron font-bold mb-6 shimmer-text">
              <span className="bg-gradient-to-r from-accent-400 via-accent-300 to-accent-500 bg-clip-text text-transparent">
                Transform Your Vision
              </span>
              <br />
              <span className="text-white">
                Into Digital Reality
              </span>
            </h1>
            <p className="text-gray-300 text-lg md:text-xl max-w-2xl mx-auto">
              Crafting exceptional digital experiences through 3D modeling, 
              web design, and artificial intelligence solutions.
            </p>
          </motion.div>

          <motion.div
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
            variants={itemVariants}
          >
            <a 
              href="#portfolio" 
              className="group px-9 py-3.5 bg-gradient-to-br from-accent-700 to-accent-500 hover:from-accent-600 hover:to-accent-400 text-white rounded-lg transition-all transform hover:scale-105 shadow-xl shadow-accent-500/40 flex items-center gap-2 backdrop-blur-sm"
              aria-label="View our portfolio"
            >
              View Portfolio
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </a>
            <a 
              href="#contact" 
              className="px-9 py-3.5 glass hover:bg-accent-600/10 text-white rounded-lg transition-all transform hover:scale-105 backdrop-blur-sm border-accent-400/30 hover:border-accent-400/50"
              aria-label="Contact us"
            >
              Get in Touch
            </a>
          </motion.div>
        </div>
      </motion.div>

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.8 }}
        aria-hidden="true"
      >
        <div className="w-6 h-10 rounded-full border-2 border-accent-400/50 flex justify-center items-start p-2">
          <div className="w-1 h-2 bg-accent-400 rounded-full animate-pulse-slow" />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;