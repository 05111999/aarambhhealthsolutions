import React from 'react';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import Button from '../components/common/Button';

const Contact = () => {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-light-blue text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white mb-4">Contact Us</h1>
          <p className="text-white/80 text-sm tracking-wide uppercase font-medium">
            Home <span className="mx-2">&gt;</span> Contact
          </p>
        </div>
      </section>

      <section className="py-20 bg-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            
            {/* Contact Info */}
            <div className="lg:w-1/3 space-y-8">
              <div>
                <h2 className="mb-6">Get In Touch</h2>
                <p className="text-text-muted mb-8">
                  Whether you have a question about our services, pricing, or need to book an appointment, our team is ready to answer all your questions.
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-start gap-4">
                  <div className="bg-teal/10 p-3 rounded-full shrink-0">
                    <MapPin className="text-teal" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark mb-1">Our Location</h4>
                    <p className="text-text-muted text-sm">123 Health Avenue, Khandagiri<br />Bhubaneswar, Odisha 751030</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-start gap-4">
                  <div className="bg-teal/10 p-3 rounded-full shrink-0">
                    <Phone className="text-teal" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark mb-1">Call Us</h4>
                    <p className="text-text-muted text-sm">+91 98765 43210<br />+91 98765 01234</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-start gap-4">
                  <div className="bg-teal/10 p-3 rounded-full shrink-0">
                    <Mail className="text-teal" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark mb-1">Email Us</h4>
                    <p className="text-text-muted text-sm">care@aarambh.in<br />info@aarambh.in</p>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border shadow-sm flex items-start gap-4">
                  <div className="bg-teal/10 p-3 rounded-full shrink-0">
                    <Clock className="text-teal" size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark mb-1">Working Hours</h4>
                    <p className="text-text-muted text-sm">Mon - Sat: 8:00 AM - 8:00 PM<br />Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:w-2/3">
              <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-border">
                <h3 className="text-2xl mb-2 text-primary">Send us a Message</h3>
                <p className="text-text-muted mb-8 text-sm">We aim to respond to all inquiries within 24 hours.</p>
                
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Your Name *</label>
                      <input type="text" className="w-full px-4 py-3 bg-bg border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Phone Number *</label>
                      <input type="tel" className="w-full px-4 py-3 bg-bg border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Email Address</label>
                      <input type="email" className="w-full px-4 py-3 bg-bg border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Service of Interest</label>
                      <select className="w-full px-4 py-3 bg-bg border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none">
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
                    <textarea rows="5" className="w-full px-4 py-3 bg-bg border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="How can we help you today?" required></textarea>
                  </div>

                  <Button type="submit" icon={Send} className="px-8">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="h-96 w-full bg-border relative">
        <div className="absolute inset-0 flex items-center justify-center flex-col text-text-muted">
          <MapPin size={48} className="text-teal mb-4 opacity-50" />
          <h3 className="text-xl font-semibold opacity-70">Interactive Map Placeholder</h3>
          <p className="opacity-70 text-sm">Google Maps embed will be placed here.</p>
        </div>
      </section>
    </div>
  );
};

export default Contact;
