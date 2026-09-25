import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react';
import { db } from '../lib/firebase';
import PageHero from '../components/common/PageHero';
import Button from '../components/common/Button';
import { fadeUp, staggerContainer } from '../lib/motion';

const emptyForm = { name: '', phone: '', email: '', service: '', message: '' };

const contactInfo = [
  { icon: MapPin, label: 'Our Location', value: '123 Health Avenue, Khandagiri\nBhubaneswar, Odisha 751030' },
  { icon: Phone, label: 'Call Us', value: '+91 98765 43210\n+91 98765 01234' },
  { icon: Mail, label: 'Email Us', value: 'care@aarambh.in\ninfo@aarambh.in' },
  { icon: Clock, label: 'Working Hours', value: 'Mon - Sat: 8:00 AM - 8:00 PM\nSunday: Closed' },
];

const inputClasses = 'w-full px-4 py-3 bg-bg border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

const Contact = () => {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'inquiries'), {
        type: 'contact',
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        service: form.service,
        message: form.message.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setForm(emptyForm);
    } catch {
      setError('Something went wrong sending your message. Please try again or call us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <PageHero
        breadcrumbLabel="Contact"
        eyebrow="Get In Touch"
        title="We're Here to Help"
        subtitle="Whether you have a question about our services, pricing, or need to book an appointment, our team is ready to answer all your questions."
      />

      <section className="py-24 bg-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="md:w-1/3 space-y-4"
            >
              {contactInfo.map((info) => (
                <motion.div
                  key={info.label}
                  variants={fadeUp}
                  className="bg-white p-6 rounded-2xl border border-border/50 shadow-sm flex items-start gap-4 hover:shadow-lg hover:shadow-primary/5 transition-shadow"
                >
                  <div className="bg-gradient-to-br from-primary/10 to-teal/10 p-3 rounded-xl shrink-0">
                    <info.icon className="text-primary" size={22} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark mb-1">{info.label}</h4>
                    <p className="text-text-muted text-sm whitespace-pre-line leading-relaxed">{info.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="md:w-2/3"
            >
              <div className="bg-white p-8 md:p-10 rounded-2xl border border-border/50">
                {submitted ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal/20">
                      <CheckCircle size={28} />
                    </div>
                    <h3 className="text-2xl font-semibold mb-2">Message Sent!</h3>
                    <p className="text-text-muted mb-6">Thank you for reaching out. Our team will respond within 24 hours.</p>
                    <button onClick={() => setSubmitted(false)} className="text-primary font-semibold text-sm hover:text-teal transition-colors">
                      Send another message
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl mb-2 text-text-dark">Send us a Message</h3>
                    <p className="text-text-muted mb-8 text-sm">We aim to respond to all inquiries within 24 hours.</p>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">Your Name *</label>
                          <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">Phone Number *</label>
                          <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClasses} required />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">Email Address</label>
                          <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClasses} />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-text-dark mb-1">Service of Interest</label>
                          <select name="service" value={form.service} onChange={handleChange} className={`${inputClasses} text-text-dark`}>
                            <option value="">Select a service</option>
                            <option value="physiotherapy">Physiotherapy</option>
                            <option value="occupational">Occupational Therapy</option>
                            <option value="speech">Speech Therapy</option>
                            <option value="neuro">Neuro Rehabilitation</option>
                            <option value="pediatric">Pediatric Rehabilitation</option>
                            <option value="homecare">Homecare Services</option>
                            <option value="other">Other Inquiry</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Your Message *</label>
                        <textarea
                          name="message"
                          value={form.message}
                          onChange={handleChange}
                          rows="5"
                          className={`${inputClasses} resize-none`}
                          placeholder="How can we help you today?"
                          required
                        />
                      </div>

                      {error && <p className="text-sm text-red-600">{error}</p>}

                      <Button type="submit" icon={Send} className="px-8" disabled={submitting}>
                        {submitting ? 'Sending…' : 'Send Message'}
                      </Button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="h-96 w-full bg-[#0A2540] relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.2] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_60%,transparent_100%)]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute inset-0 flex items-center justify-center flex-col text-white/70">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl mb-4 border border-white/10">
            <MapPin size={32} className="text-teal" />
          </div>
          <h3 className="text-xl font-semibold text-white/90">Find Us in Bhubaneswar</h3>
          <p className="text-sm mt-1">Interactive map embed coming soon.</p>
        </div>
      </section>
    </div>
  );
};

export default Contact;
