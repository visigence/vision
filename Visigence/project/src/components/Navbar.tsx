import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ArrowRight } from 'lucide-react';
import logoImage from '../assets/Neon Purple Visgence Logo Design.png';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const navVariants = {
    hidden: { y: -20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20
      }
    }
  };

  return (
    <motion.nav 
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'py-2 bg-black/80 backdrop-blur-md border-b border-accent-500/10' 
          : 'py-4 bg-transparent'
      }`}
      initial="hidden"
      animate="visible"
      variants={navVariants}
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between">
          <motion.a 
            href="#" 
            className="flex items-center space-x-2 text-white group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label="Visigence Home"
          >
            <motion.img
              src={logoImage}
              alt="Visigence Logo"
              className="h-10 w-auto"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.3 }}
              loading="lazy"
            />
          </motion.a>

          {/* Desktop Navigation */}
          <div 
            className="hidden md:flex items-center space-x-8"
            role="navigation"
            aria-label="Desktop navigation"
          >
            <NavLink href="#" aria-label="Home">Home</NavLink>
            <NavLink href="#portfolio" aria-label="View Portfolio">Portfolio</NavLink>
            <NavLink href="#about" aria-label="About Us">About</NavLink>
            <NavLink href="#contact" aria-label="Contact">Contact</NavLink>
            <motion.a
              href="#contact"
              className="group px-7 py-2.5 bg-gradient-to-r from-accent-700 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-white rounded-lg transition-all flex items-center gap-2 shadow-xl shadow-accent-500/40 backdrop-blur-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Get in touch with us"
            >
              Get in Touch
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </motion.a>
          </div>

          {/* Mobile Menu Button */}
          <motion.button 
            className="md:hidden relative w-10 h-10 text-white flex items-center justify-center"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={mobileMenuOpen ? "close" : "menu"}
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              id="mobile-menu"
              className="md:hidden mt-4 overflow-hidden bg-black/50 backdrop-blur-sm rounded-lg border border-accent-500/10"
              variants={mobileMenuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              role="navigation"
              aria-label="Mobile navigation"
            >
              <motion.div className="flex flex-col p-4 space-y-4" variants={itemVariants}>
                <MobileNavLink href="#" onClick={() => setMobileMenuOpen(false)} aria-label="Home">
                  Home
                </MobileNavLink>
                <MobileNavLink href="#portfolio" onClick={() => setMobileMenuOpen(false)} aria-label="View Portfolio">
                  Portfolio
                </MobileNavLink>
                <MobileNavLink href="#about" onClick={() => setMobileMenuOpen(false)} aria-label="About Us">
                  About
                </MobileNavLink>
                <MobileNavLink href="#contact" onClick={() => setMobileMenuOpen(false)} aria-label="Contact">
                  Contact
                </MobileNavLink>
                <motion.a
                  href="#contact"
                  className="group px-7 py-2.5 bg-gradient-to-r from-accent-700 to-accent-600 hover:from-accent-600 hover:to-accent-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent-500/40 backdrop-blur-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Get in touch with us"
                >
                  Get in Touch
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </motion.a>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

const NavLink: React.FC<{ href: string; children: React.ReactNode; 'aria-label': string }> = ({ href, children, 'aria-label': ariaLabel }) => (
  <motion.a
    href={href}
    className="text-gray-300 hover:text-white relative group py-2"
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    aria-label={ariaLabel}
  >
    {children}
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-accent-500 to-accent-400 group-hover:w-full transition-all duration-300" aria-hidden="true" />
  </motion.a>
);

const MobileNavLink: React.FC<{ href: string; onClick: () => void; children: React.ReactNode; 'aria-label': string }> = ({ href, onClick, children, 'aria-label': ariaLabel }) => (
  <motion.a
    href={href}
    className="text-gray-300 hover:text-white px-4 py-2 rounded-lg hover:bg-accent-500/10 transition-colors flex items-center gap-2"
    onClick={onClick}
    whileHover={{ scale: 1.02, x: 4 }}
    whileTap={{ scale: 0.98 }}
    aria-label={ariaLabel}
  >
    {children}
  </motion.a>
);

export default Navbar;