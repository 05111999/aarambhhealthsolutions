import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { X, Send, CalendarHeart } from 'lucide-react';
import { db } from '../../lib/firebase';
import Button from './Button';

const BookingModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service: '',
    date: '',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        type: 'booking',
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service: formData.service,
        preferredDate: formData.date,
        message: formData.message.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setTimeout(() => {
        onClose();
        setSubmitted(false);
        setFormData({ name: '', phone: '', service: '', date: '', message: '' });
      }, 2500);
    } catch {
      setError('Something went wrong sending your request. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-text-dark/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <div className="fixed inset-0 flex items-center justify-center z-[101] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto pointer-events-auto"
            >
              <div className="flex justify-between items-center p-6 border-b border-border bg-bg sticky top-0 rounded-t-2xl z-10">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-primary to-teal p-2.5 rounded-xl">
                    <CalendarHeart size={20} className="text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-text-dark mb-0">Book a Consultation</h3>
                </div>
                <button
                  onClick={onClose}
                  className="text-text-muted hover:text-text-dark transition-colors p-1"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal/20">
                      <Send size={28} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Request Sent!</h3>
                    <p className="text-text-muted">
                      Thank you. Our team will contact you shortly to confirm your appointment.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Phone Number *</label>
                        <input 
                          type="tel" 
                          name="phone"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                          placeholder="+91 98765 43210"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Preferred Date</label>
                        <input 
                          type="date" 
                          name="date"
                          value={formData.date}
                          onChange={handleChange}
                          className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Service of Interest</label>
                      <select 
                        name="service"
                        value={formData.service}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-text-dark bg-white"
                      >
                        <option value="">Select a service</option>
                        <option value="physiotherapy">Physiotherapy</option>
                        <option value="occupational">Occupational Therapy</option>
                        <option value="speech">Speech Therapy</option>
                        <option value="neuro">Neuro Rehabilitation</option>
                        <option value="pediatric">Pediatric Rehabilitation</option>
                        <option value="homecare">Homecare Services</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Additional Message (Optional)</label>
                      <textarea 
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                        placeholder="Briefly describe your condition or requirements..."
                      ></textarea>
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <div className="pt-2">
                      <Button type="submit" className="w-full" icon={Send} disabled={submitting}>
                        {submitting ? 'Sending…' : 'Submit Request'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BookingModal;
