import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VanillaTilt from 'vanilla-tilt';
import { X, ExternalLink, Loader2 } from 'lucide-react';

// Define TypeScript interfaces with stricter types
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

/**
 * Individual portfolio card component with optimized performance
 */
const PortfolioCard: React.FC<PortfolioCardProps> = ({ project }) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [iframeLoading, setIframeLoading] = useState<boolean>(true);
  const [iframeError, setIframeError] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const tiltRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Debounced resize handler for better performance
  const checkMobile = useCallback(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    const timeoutId = setTimeout(handleResize, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Initialize VanillaTilt and handle mobile detection
  useEffect(() => {
    checkMobile()();
    const cleanup = checkMobile();
    window.addEventListener('resize', cleanup);

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
      window.removeEventListener('resize', cleanup);
      if (tiltRef.current && !isMobile) {
        (tiltRef.current as any).vanillaTilt?.destroy();
      }
    };
  }, [isMobile, checkMobile]);

  // Handle modal accessibility and keyboard navigation
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  // Optimized mouse movement handler for shimmer effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / element.clientWidth) * 100;
    const y = ((e.clientY - rect.top) / element.clientHeight) * 100;
    element.style.setProperty('--x', `${x}%`);
    element.style.setProperty('--y', `${y}%`);
  }, []);

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.setProperty('--x', '50%');
    e.currentTarget.style.setProperty('--y', '50%');
  }, []);

  // Animation variants for better performance
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

  // Image loading handlers
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
  }, []);

  const handleIframeLoad = useCallback(() => {
    setIframeLoading(false);
    setIframeError(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIframeLoading(false);
    setIframeError(true);
  }, []);

  // Memoize responsive image sources for better performance
  const imageSources = useMemo(() => {
    const baseUrl = project.image;
    return {
      small: `${baseUrl}?w=400&h=300&fit=crop&auto=format`,
      medium: `${baseUrl}?w=800&h=600&fit=crop&auto=format`,
      large: `${baseUrl}?w=1200&h=900&fit=crop&auto=format`
    };
  }, [project.image]);

  // Memoize the tags rendering to prevent unnecessary re-renders
  const renderedTags = useMemo(() => project.tags.map((tag, index) => (
    <motion.span 
      key={`${tag}-${index}`}
      className="text-xs bg-primary-800/50 backdrop-blur-sm px-2 py-1 rounded-full text-primary-200"
      initial={{ scale: 0, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.1 * index }}
    >
      {tag}
    </motion.span>
  )), [project.tags]);

  return (
    <>
      <motion.div
        ref={tiltRef}
        className="portfolio-card h-[450px] group relative overflow-hidden cursor-pointer rounded-xl shadow-lg"
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
        onMouseLeave={handleMouseLeave}
      >
        <div className="relative h-full w-full overflow-hidden">
          <div className="shimmer-overlay absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="digital-grid absolute inset-0 z-20" />
          <div className="data-flow absolute inset-0 z-30 group-hover:opacity-30 transition-opacity duration-300" />
          
          {/* Responsive image with loading state */}
          <div className="relative h-full w-full">
            {!imageLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent-400" />
              </div>
            )}
            <img
              src={project.image}
              srcSet={`
                ${imageSources.small} 400w,
                ${imageSources.medium} 800w,
                ${imageSources.large} 1200w
              `}
              sizes="(max-width: 768px) 400px, (max-width: 1200px) 800px, 1200px"
              alt={`Preview of ${project.title}`}
              className={`object-cover h-full w-full transform transition-all duration-700 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={handleImageLoad}
              loading="lazy"
              decoding="async"
            />
          </div>
          
          <div className="absolute top-4 left-4 bg-primary-800/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-white">
            {project.category}
          </div>
          
          <motion.div 
            className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent"
            variants={overlayVariants}
          >
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <motion.h3 
                id={`project-${project.id}-title`}
                className="text-xl font-bold mb-2 text-white"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                {project.title}
              </motion.h3>
              <motion.p 
                className="text-gray-200 mb-4 text-sm line-clamp-3"
                initial={{ y: 20, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {project.description}
              </motion.p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {renderedTags}
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
              ref={modalRef}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-primary-900 rounded-xl overflow-hidden max-w-4xl w-full max-h-[90vh] relative glass"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              tabIndex={-1}
            >
              <motion.button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors text-white z-10 focus:outline-none focus:ring-2 focus:ring-accent-400"
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
                
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-black/20 backdrop-blur-sm">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-md"
                  >
                    <h4 className="text-2xl font-bold text-white mb-4">
                      Service Information
                    </h4>
                    <p className="text-gray-300 mb-8">
                      {project.description}
                    </p>
                    <motion.a
                      href={project.liveUrl}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-accent-600 hover:bg-accent-500 rounded-lg text-white transition-colors focus:outline-none focus:ring-2 focus:ring-accent-400"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Learn More
                      <ExternalLink size={16} />
                    </motion.a>
                  </motion.div>
                </div>
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
                      key={`${tag}-${index}`}
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
                    className="w-full px-6 py-2 bg-accent-600 hover:bg-accent-500 rounded-md transition-colors text-white flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent-400"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Learn More
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

/**
 * Portfolio container component that manages project data
 */
const Portfolio: React.FC = () => {
  // Static project data for your 5 service categories
  const projects: Project[] = useMemo(() => [
    {
      id: 1,
      title: "Web Design & Development",
      category: "Web Development",
      description: "Custom website/UI design, landing pages, brand identity websites (portfolios, agencies, creators), UX/UI audits and redesigns. Modern, responsive web applications with intuitive user experience.",
      image: "https://i.imgur.com/KvkKQXH.jpg",
      tags: ["React", "TypeScript", "UI/UX", "Responsive", "Modern"],
      liveUrl: "#contact",
      sourceUrl: "#contact"
    },
    {
      id: 2,
      title: "3D Model Assets",
      category: "3D Modeling",
      description: "Custom avatars for VTuber/streamer asset packs, game-ready props, weapons, vehicles, game characters. Asset packs for Unity/Unreal, model optimization & retopology.",
      image: "https://i.imgur.com/8YzQZXH.jpg",
      tags: ["Blender", "Unity", "Unreal", "Game Assets", "3D"],
      liveUrl: "#contact",
      sourceUrl: "#contact"
    },
    {
      id: 3,
      title: "Branding & Graphic Design",
      category: "Branding",
      description: "Logo & visual identity, brand guidelines & style guides, social media kits (banners, thumbnails, templates). Complete brand identity solutions for modern businesses.",
      image: "https://i.imgur.com/9KzQXvH.jpg",
      tags: ["Logo Design", "Branding", "Social Media", "Identity", "Graphics"],
      liveUrl: "#contact",
      sourceUrl: "#contact"
    },
    {
      id: 4,
      title: "Digital Illustration & Concept Art",
      category: "Digital Art",
      description: "Game/film concept art (characters, creatures, furniture), book/album covers, posters, storyboards, UI illustrations and mascots. Creative visual storytelling.",
      image: "https://i.imgur.com/7YzQXvH.jpg",
      tags: ["Concept Art", "Illustration", "Character Design", "Digital Art", "Creative"],
      liveUrl: "#contact",
      sourceUrl: "#contact"
    },
    {
      id: 5,
      title: "Prompt Engineering Design",
      category: "AI Solutions",
      description: "Custom structure prompts for your needs, combining creativity, technical know-how, and strategy effectively to make it unique for brand, product. AI-powered solutions tailored to your business.",
      image: "https://i.imgur.com/6YzQXvH.jpg",
      tags: ["AI", "Prompt Engineering", "Strategy", "Custom Solutions", "Innovation"],
      liveUrl: "#contact",
      sourceUrl: "#contact"
    }
  ], []);

  return (
    <section id="portfolio" className="py-20 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Our <span className="text-accent-400">Services</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Explore our comprehensive range of creative and technical services designed to bring your vision to life.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <PortfolioCard project={project} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Portfolio;