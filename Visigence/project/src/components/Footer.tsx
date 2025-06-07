import React from 'react';
import { motion } from 'framer-motion';
import { Github, Twitter, Linkedin, Instagram, Braces, ArrowRight } from 'lucide-react';
import ContactForm from './ContactForm';

const Footer: React.FC = () => {
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

  const socialVariants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    }
  };

  const linkVariants = {
    hover: {
      x: 4,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };

  return (
    <motion.footer 
      id="contact" 
      className="bg-black relative"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-500/10 via-transparent to-transparent" />
      </div>
      
      <motion.div 
        className="container mx-auto px-6 pt-20 pb-8 relative z-10"
        variants={containerVariants}
      >
        {/* Contact Form Section */}
        <motion.div 
          className="max-w-4xl mx-auto mb-16"
          variants={itemVariants}
        >
          <ContactForm />
        </motion.div>

        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} className="mb-8 md:mb-0">
            <motion.div 
              className="flex items-center space-x-2 mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Braces className="h-6 w-6 text-accent-400" />
              <span className="text-xl font-orbitron font-bold">Visigence</span>
            </motion.div>
            <motion.p 
              className="text-gray-400 mb-6"
              variants={itemVariants}
            >
              Limitless possibilities, above imagination.
            </motion.p>
            <motion.div 
              className="flex space-x-4"
              variants={containerVariants}
            >
              {[
                { Icon: Twitter, href: "#", label: "Twitter" },
                { Icon: Github, href: "#", label: "GitHub" },
                { Icon: Linkedin, href: "#", label: "LinkedIn" },
                { Icon: Instagram, href: "#", label: "Instagram" }
              ].map(({ Icon, href, label }, index) => (
                <motion.a
                  key={index}
                  href={href}
                  className="text-gray-400 hover:text-accent-400 transition-colors"
                  variants={socialVariants}
                  whileHover={{ scale: 1.2, rotate: 10 }}
                  whileTap={{ scale: 0.9 }}
                  aria-label={label}
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </motion.div>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-orbitron font-bold mb-4">Services</h3>
            <motion.ul className="space-y-2">
              {['3D Modeling', 'Web Design', 'AI Solutions', 'Consultation'].map((service, index) => (
                <motion.li key={index} variants={linkVariants} whileHover="hover">
                  <motion.a 
                    href="#portfolio" 
                    className="text-gray-400 hover:text-accent-400 transition-colors flex items-center gap-2 group"
                  >
                    {service}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-orbitron font-bold mb-4">Quick Links</h3>
            <motion.ul className="space-y-2">
              {[
                { text: 'Home', href: '#' },
                { text: 'Portfolio', href: '#portfolio' },
                { text: 'About', href: '#about' },
                { text: 'Contact', href: '#contact' }
              ].map((link, index) => (
                <motion.li key={index} variants={linkVariants} whileHover="hover">
                  <motion.a 
                    href={link.href} 
                    className="text-gray-400 hover:text-accent-400 transition-colors flex items-center gap-2 group"
                  >
                    {link.text}
                    <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </motion.a>
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-orbitron font-bold mb-4">Contact Info</h3>
            <motion.div className="space-y-3 text-gray-400">
              <p>Ready to bring your vision to life?</p>
              <p>Use the contact form above to get started.</p>
              <p className="text-accent-400 font-medium">
                Response time: Within 24 hours
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
        
        <motion.div 
          className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center"
          variants={itemVariants}
        >
          <motion.p 
            className="text-gray-500 text-sm text-center md:text-left"
            variants={itemVariants}
          >
            &copy; {new Date().getFullYear()} Visigence. All rights reserved.
          </motion.p>
          <motion.p 
            className="text-gray-500 text-sm mt-2 md:mt-0"
            variants={itemVariants}
          >
            Designed by Omry Damari
          </motion.p>
        </motion.div>
      </motion.div>
    </motion.footer>
  );
};

export default Footer;