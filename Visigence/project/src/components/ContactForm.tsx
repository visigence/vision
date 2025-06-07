import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { db } from '../lib/supabase';

interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  phone?: string;
  company?: string;
  serviceInterest: string[];
  budgetRange?: string;
  timeline?: string;
  source?: string;
}

const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
    phone: '',
    company: '',
    serviceInterest: [],
    budgetRange: '',
    timeline: '',
    source: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const services = [
    'Web Design & Development',
    '3D Model Assets',
    'Branding & Graphic Design',
    'Digital Illustration & Concept Art',
    'Prompt Engineering Design'
  ];

  const budgetRanges = [
    'Under $1,000',
    '$1,000 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000+'
  ];

  const timelines = [
    'ASAP',
    '1-2 weeks',
    '1 month',
    '2-3 months',
    '3+ months'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleServiceChange = (service: string) => {
    setFormData(prev => ({
      ...prev,
      serviceInterest: prev.serviceInterest.includes(service)
        ? prev.serviceInterest.filter(s => s !== service)
        : [...prev.serviceInterest, service]
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim() || formData.name.length < 2) {
      setErrorMessage('Name must be at least 2 characters long');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('Please enter a valid email address');
      return false;
    }

    if (!formData.message.trim() || formData.message.length < 10) {
      setErrorMessage('Message must be at least 10 characters long');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // For now, continue using Supabase directly for contact submissions
      // since the backend endpoint might not be implemented yet
      const submissionData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim() || 'General Inquiry',
        message: formData.message.trim(),
        phone: formData.phone?.trim() || null,
        company: formData.company?.trim() || null,
        service_interest: formData.serviceInterest.length > 0 ? formData.serviceInterest : null,
        budget_range: formData.budgetRange || null,
        timeline: formData.timeline || null,
        source: formData.source || null,
        ip_address: null, // This would be set by the server
        user_agent: navigator.userAgent
      };

      const { error } = await db.createContactSubmission(submissionData);

      if (error) {
        throw error;
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        phone: '',
        company: '',
        serviceInterest: [],
        budgetRange: '',
        timeline: '',
        source: ''
      });

      // Reset success message after 5 seconds
      setTimeout(() => {
        setSubmitStatus('idle');
      }, 5000);

    } catch (error: any) {
      console.error('Contact form submission error:', error);
      setErrorMessage(error.message || 'Failed to send message. Please try again.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
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

  if (submitStatus === 'success') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass p-8 rounded-2xl text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4"
        >
          <CheckCircle className="w-8 h-8 text-green-400" />
        </motion.div>
        <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
        <p className="text-gray-300 mb-6">
          Thank you for reaching out. We'll get back to you within 24 hours.
        </p>
        <motion.button
          onClick={() => setSubmitStatus('idle')}
          className="px-6 py-2 bg-accent-600 hover:bg-accent-500 rounded-lg text-white transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Send Another Message
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="glass p-8 rounded-2xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.h3 
        className="text-2xl font-bold text-white mb-6"
        variants={itemVariants}
      >
        Get in Touch
      </motion.h3>

      {submitStatus === 'error' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-4 bg-red-500/20 border border-red-500/30 rounded-lg mb-6"
        >
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-300">{errorMessage}</span>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div variants={itemVariants}>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
            placeholder="Your full name"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
            placeholder="your.email@example.com"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div variants={itemVariants}>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
            Phone
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
            placeholder="Your phone number"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
            placeholder="Your company name"
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mb-6">
        <label htmlFor="subject" className="block text-sm font-medium text-gray-300 mb-2">
          Subject
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
          placeholder="What's this about?"
        />
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Services of Interest
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {services.map((service) => (
            <label key={service} className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.serviceInterest.includes(service)}
                onChange={() => handleServiceChange(service)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 mr-3 flex items-center justify-center transition-all ${
                formData.serviceInterest.includes(service)
                  ? 'bg-accent-600 border-accent-600'
                  : 'border-primary-700 hover:border-accent-400'
              }`}>
                {formData.serviceInterest.includes(service) && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
              <span className="text-gray-300 text-sm">{service}</span>
            </label>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div variants={itemVariants}>
          <label htmlFor="budgetRange" className="block text-sm font-medium text-gray-300 mb-2">
            Budget Range
          </label>
          <select
            id="budgetRange"
            name="budgetRange"
            value={formData.budgetRange}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
          >
            <option value="">Select budget range</option>
            {budgetRanges.map((range) => (
              <option key={range} value={range}>{range}</option>
            ))}
          </select>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label htmlFor="timeline" className="block text-sm font-medium text-gray-300 mb-2">
            Timeline
          </label>
          <select
            id="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleInputChange}
            className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
          >
            <option value="">Select timeline</option>
            {timelines.map((time) => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="mb-6">
        <label htmlFor="source" className="block text-sm font-medium text-gray-300 mb-2">
          How did you hear about us?
        </label>
        <select
          id="source"
          name="source"
          value={formData.source}
          onChange={handleInputChange}
          className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white"
        >
          <option value="">Select source</option>
          <option value="Google Search">Google Search</option>
          <option value="Social Media">Social Media</option>
          <option value="Referral">Referral</option>
          <option value="Portfolio">Portfolio</option>
          <option value="Other">Other</option>
        </select>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6">
        <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
          Message *
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleInputChange}
          required
          rows={5}
          className="w-full px-4 py-3 bg-primary-900/50 border border-primary-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent transition-all text-white resize-vertical"
          placeholder="Tell us about your project..."
        />
      </motion.div>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        className="w-full px-6 py-3 bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 disabled:from-gray-600 disabled:to-gray-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 font-medium"
        variants={itemVariants}
        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            Send Message
            <Send className="w-5 h-5" />
          </>
        )}
      </motion.button>
    </motion.form>
  );
};

export default ContactForm;