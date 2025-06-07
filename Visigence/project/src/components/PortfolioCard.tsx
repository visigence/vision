import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VanillaTilt from 'vanilla-tilt';
import { X, ExternalLink, Loader2 } from 'lucide-react';

interface Project {
  id: number;
  title: string;
  category: string;
  description: string;
  image: string;
  tags: string[];
  liveUrl: string;
  sourceUrl: string;
}

interface PortfolioCardProps {
  project: Project;
}

const PortfolioCard: React.FC<PortfolioCardProps> = ({ project }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [iframeError, setIframeError] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);

    if (tiltRef.current && !isMobile) {
      VanillaTilt.init(tiltRef.current, {
        max: 25,
        speed: 400,
        glare: true,
        'max-glare': 0.5,
        scale: 1.05,
      });
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
      if (tiltRef.current && !isMobile) {
        (tiltRef.current as any).vanillaTilt?.destroy();
      }
    };
  }, [isMobile]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / element.clientWidth) * 100;
    const y = ((e.clientY - rect.top) / element.clientHeight) * 100;
    element.style.setProperty('--x', `${x}%`);
    element.style.setProperty('--y', `${y}%`);
  };

  const cardVariants = {
    rest: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { 
      scale: 0.98,
      transition: { 
        type: "spring",
        stiffness: 400,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    rest: { opacity: 0 },
    hover: { 
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const modalVariants = {
    hidden: {
      opacity: 0,
      scale: 0.8,
      y: 20
    },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    }
  };

  const handleIframeLoad = () => {
    setIframeLoading(false);
    setIframeError(false);
  };

  const handleIframeError = () => {
    setIframeLoading(false);
    setIframeError(true);
  };

  return (
    <>
      <motion.div
        ref={tiltRef}
        className="portfolio-card h-[450px] group relative overflow-hidden cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        variants={cardVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        role="button"
        aria-haspopup="dialog"
        aria-expanded={isModalOpen}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setIsModalOpen(true);
            e.preventDefault();
          }
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={(e) => {
          e.currentTarget.style.setProperty('--x', '50%');
          e.currentTarget.style.setProperty('--y', '50%');
        }}
      >
        <div className="relative h-full w-full overflow-hidden">
          <div className="shimmer-overlay absolute inset-0 z-10 opacity-0 group-hover:opacity-100" />
          <div className="digital-grid absolute inset-0 z-20" />
          <div className="data-flow absolute inset-0 z-30 group-hover:opacity-30" />
          
          <motion.img
            src={project.image}
            alt={project.title}
            className="object-cover h-full w-full transform transition-transform duration-700"
            initial={false}
            animate={{ scale: isModalOpen ? 1.1 : 1 }}
            loading="lazy"
          />
          
          <div className="absolute top-4 left-4 bg-primary-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
            {project.category}
          </div>
          
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
            variants={overlayVariants}
          >
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.h3 
                className="text-xl font-bold mb-2 text-white"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {project.title}
              </motion.h3>
              <motion.p 
                className="text-gray-200 mb-4"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {project.description}
              </motion.p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag, index) => (
                  <motion.span 
                    key={index}
                    className="text-xs bg-primary-800/50 backdrop-blur-sm px-2 py-1 rounded-full text-primary-200"
                    initial={{ scale: 0, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 * index }}
                  >
                    {tag}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
            role="dialog"
            aria-labelledby={`modal-${project.id}-title`}
            aria-modal="true"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-primary-900 rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] relative glass"
              onMouseMove={handleMouseMove}
              onMouseLeave={(e) => {
                e.currentTarget.style.setProperty('--x', '50%');
                e.currentTarget.style.setProperty('--y', '50%');
              }}
            >
              <motion.button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white z-10"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Close modal"
              >
                <X size={24} />
              </motion.button>

              <div className="h-[500px] md:h-[600px] relative overflow-hidden">
                {iframeLoading && !iframeError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-accent-400"
                    >
                      <Loader2 size={32} />
                    </motion.div>
                  </div>
                )}
                
                {iframeError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-sm">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className="max-w-md"
                    >
                      <h4 className="text-2xl font-bold text-white mb-4">
                        Interactive Preview Unavailable
                      </h4>
                      <p className="text-gray-300 mb-8">
                        The live demo cannot be embedded here, but you can experience the full version by visiting the project directly.
                      </p>
                      <motion.a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-500 rounded-lg text-white transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        Open Live Demo
                        <ExternalLink size={16} />
                      </motion.a>
                    </motion.div>
                  </div>
                ) : (
                  <iframe
                    src={project.liveUrl}
                    title={`${project.title} preview`}
                    className="w-full h-full border-0"
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-same-origin"
                  />
                )}
              </div>

              <motion.div 
                className="p-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h3 id={`modal-${project.id}-title`} className="text-2xl font-bold mb-4 text-white">
                  {project.title}
                </h3>
                <p className="text-gray-300 mb-6">{project.description}</p>

                <div className="flex flex-wrap gap-2 mb-6">
                  {project.tags.map((tag, index) => (
                    <motion.span
                      key={index}
                      className="px-3 py-1 bg-primary-800 rounded-full text-sm text-primary-200"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      {tag}
                    </motion.span>
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
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PortfolioCard;