import React, { useEffect, useRef, useCallback } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Award, Code, Cpu, Layers } from 'lucide-react';
import VanillaTilt from 'vanilla-tilt';

const services = [
  {
    icon: <Layers className="h-8 w-8 text-accent-400" />,
    title: "3D Modeling",
    description: "High-fidelity 3D models and visualizations with photorealistic rendering and animation capabilities."
  },
  {
    icon: <Code className="h-8 w-8 text-secondary-400" />,
    title: "Web Design",
    description: "Modern, responsive web applications with intuitive UX design, animation, and interactive elements."
  },
  {
    icon: <Cpu className="h-8 w-8 text-primary-400" />,
    title: "AI Solutions",
    description: "Custom artificial intelligence solutions for data analytics, predictive modeling, and automation."
  },
  {
    icon: <Award className="h-8 w-8 text-accent-400" />,
    title: "Premium Quality",
    description: "Commitment to excellence in every project, ensuring the highest standards of quality and performance."
  }
];

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
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 20,
      duration: 0.8
    }
  }
};

const About = () => {
  const containerRef = useRef(null);
  const tiltRefs = useRef([]);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);

  // Optimized handler
  const handleMouseMove = useCallback((e) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / element.clientWidth) * 100;
    const y = ((e.clientY - rect.top) / element.clientHeight) * 100;
    element.style.setProperty('--x', `${x}%`);
    element.style.setProperty('--y', `${y}%`);
  }, []);

  useEffect(() => {
    tiltRefs.current.forEach(ref => {
      if (ref) {
        VanillaTilt.init(ref, {
          max: 15,
          speed: 400,
          glare: true,
          "max-glare": 0.3,
          scale: 1.04,
        });
      }
    });
    return () => {
      tiltRefs.current.forEach(ref => {
        ref?.vanillaTilt?.destroy();
      });
    };
  }, []);

  return (
    <section id="about" className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-accent-950/50 to-accent-950 opacity-80 z-0 pointer-events-none">
        <div className="subtle-pattern-overlay absolute inset-0 pointer-events-none" />
      </div>
      
      <motion.div
        ref={containerRef}
        className="container mx-auto px-6 relative z-10"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{ y, opacity }}
      >
        {/* HEADLINE */}
        <motion.div className="text-center mb-20" variants={itemVariants}>
          <h2 className="shimmer-text text-4xl md:text-5xl lg:text-6xl font-orbitron font-bold mb-6">
            About <span>Visigence</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We transform visions into reality through cutting-edge technology and creative innovation.
          </p>
        </motion.div>

        {/* ABOUT BLOCK */}
        <motion.div variants={itemVariants}>
          <div 
            className="glass p-8 md:p-12 rounded-2xl mb-20 group hover:scale-[1.03] transition-transform duration-500 relative"
            onMouseMove={handleMouseMove}
            onMouseLeave={e => {
              e.currentTarget.style.setProperty('--x', '50%');
              e.currentTarget.style.setProperty('--y', '50%');
            }}
            aria-label="About Visigence"
          >
            <div className="absolute -inset-0.5 rounded-2xl pointer-events-none bg-gradient-to-br from-accent-500/10 to-primary-500/5 blur-lg opacity-80 group-hover:opacity-100 transition-all" />
            <p className="text-xl text-gray-300 leading-relaxed mb-8 z-10 relative">
              Founded on the principle that technology should enhance creativity, Visigence brings together expertise in 3D modeling, web design, and artificial intelligence to deliver exceptional digital experiences. Our approach is driven by a deep understanding of both technical capabilities and aesthetic design, allowing us to create solutions that are not only functional but visually stunning.
            </p>
            <p className="text-xl text-gray-300 leading-relaxed z-10 relative">
              With a commitment to innovation and quality, we work closely with clients to understand their vision and bring it to life. Our team of specialists combines technical excellence with creative insight, ensuring that every project exceeds expectations.
            </p>
          </div>
        </motion.div>

        {/* FOUNDER BLOCK */}
        <motion.div
          className="glass p-8 md:p-12 rounded-2xl mb-20 text-center"
          variants={itemVariants}
          onMouseMove={handleMouseMove}
          onMouseLeave={e => {
            e.currentTarget.style.setProperty('--x', '50%');
            e.currentTarget.style.setProperty('--y', '50%');
          }}
          aria-label="Founder of Visigence"
        >
          <motion.div
            className="relative w-48 h-48 mx-auto mb-8"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full blur-lg opacity-60 animate-pulse" />
            <img
              src="https://i.imgur.com/7pQ0mxh.jpeg"
              alt="Omry Damari, Founder of Visigence"
              title="Omry Damari - Founder"
              className="relative w-full h-full object-cover rounded-full border-4 border-accent-400/30 shadow-xl"
              loading="lazy"
            />
          </motion.div>
          <motion.h3
            className="text-3xl font-bold mb-2 bg-gradient-to-r from-accent-400 to-primary-400 bg-clip-text text-transparent"
            variants={itemVariants}
          >
            Omry Damari
          </motion.h3>
          <motion.p className="text-xl text-gray-300 mb-6" variants={itemVariants}>
            Founder &amp; Lead Developer
          </motion.p>
          <motion.p className="text-lg text-gray-400 max-w-2xl mx-auto" variants={itemVariants}>
            "My vision is to push the boundaries of what's possible in digital experiences, combining cutting-edge technology with stunning design to create solutions that inspire and innovate."
          </motion.p>
        </motion.div>

        {/* SERVICES */}
        <motion.h3
          className="text-3xl md:text-4xl font-orbitron font-bold mb-12 text-center bg-gradient-to-r from-accent-400 to-secondary-400 bg-clip-text text-transparent"
          variants={itemVariants}
        >
          Our Services
        </motion.h3>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          layout
        >
          {services.map((service, index) => (
            <motion.div
              key={index}
              ref={el => (tiltRefs.current[index] = el)}
              className="service-card glass p-8 rounded-2xl hover:border-accent-400/70 transition-all duration-500 group"
              variants={itemVariants}
              whileHover={{ y: -12, scale: 1.03 }}
              onMouseMove={handleMouseMove}
              onMouseLeave={e => {
                e.currentTarget.style.setProperty('--x', '50%');
                e.currentTarget.style.setProperty('--y', '50%');
              }}
              aria-label={service.title}
              tabIndex={0}
              data-tilt
            >
              <div className="flex flex-col items-center text-center">
                <motion.div
                  className="mb-6 p-4 rounded-full bg-gradient-to-br from-accent-600/20 to-transparent group-hover:shadow-lg"
                  whileHover={{
                    rotate: 360,
                    scale: 1.11,
                    transition: { duration: 0.9, ease: "easeInOut" }
                  }}
                >
                  {service.icon}
                </motion.div>
                <h3 className="text-2xl font-orbitron font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {service.title}
                </h3>
                <p className="text-gray-300 text-lg leading-relaxed">
                  {service.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
};

export default About;
