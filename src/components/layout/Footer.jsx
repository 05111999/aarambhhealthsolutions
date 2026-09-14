import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111827] text-white pt-16 pb-8 border-t-4 border-primary">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Col */}
          <div>
            <Link to="/" className="flex items-center gap-2 text-white mb-6">
              <div className="bg-white/10 p-2 rounded-lg">
                <Heart size={28} className="text-teal fill-teal/20" />
              </div>
              <div>
                <h2 className="text-xl font-bold leading-none text-white m-0 p-0 text-[24px]">AArambh</h2>
                <span className="text-[10px] text-teal uppercase tracking-wider font-semibold block mt-0.5">Rehabilitation Care</span>
              </div>
            </Link>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">
              A New Beginning in Care. Providing compassionate, ethical, and trustworthy rehabilitation services across Odisha.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"><Facebook size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"><Twitter size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"><Instagram size={18} /></a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white transition-colors"><Linkedin size={18} /></a>
            </div>
          </div>

          {/* Services Col */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-gray-800 pb-2">Our Services</h4>
            <ul className="space-y-3">
              <li><Link to="/services/physiotherapy" className="text-gray-400 hover:text-teal transition-colors text-sm">Physiotherapy</Link></li>
              <li><Link to="/services/occupational-therapy" className="text-gray-400 hover:text-teal transition-colors text-sm">Occupational Therapy</Link></li>
              <li><Link to="/services/speech-therapy" className="text-gray-400 hover:text-teal transition-colors text-sm">Speech Therapy</Link></li>
              <li><Link to="/services/neuro-rehabilitation" className="text-gray-400 hover:text-teal transition-colors text-sm">Neuro Rehabilitation</Link></li>
              <li><Link to="/services/pediatric-rehabilitation" className="text-gray-400 hover:text-teal transition-colors text-sm">Pediatric Rehabilitation</Link></li>
              <li><Link to="/services/homecare-services" className="text-gray-400 hover:text-teal transition-colors text-sm">Homecare Services</Link></li>
            </ul>
          </div>

          {/* Quick Links Col */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-gray-800 pb-2">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-gray-400 hover:text-teal transition-colors text-sm">About Us</Link></li>
              <li><Link to="/partner" className="text-gray-400 hover:text-teal transition-colors text-sm">Partner With Us</Link></li>
              <li><Link to="/careers" className="text-gray-400 hover:text-teal transition-colors text-sm">Careers</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-teal transition-colors text-sm">Contact Us</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-teal transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link to="#" className="text-gray-400 hover:text-teal transition-colors text-sm">Terms of Service</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-lg font-semibold mb-6 text-white border-b border-gray-800 pb-2">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={20} className="text-teal mt-0.5 flex-shrink-0" />
                <span className="text-gray-400 text-sm">123 Health Avenue, Khandagiri, Bhubaneswar, Odisha 751030</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={20} className="text-teal flex-shrink-0" />
                <a href="tel:+919876543210" className="text-gray-400 hover:text-white transition-colors text-sm">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={20} className="text-teal flex-shrink-0" />
                <a href="mailto:care@aarambh.in" className="text-gray-400 hover:text-white transition-colors text-sm">care@aarambh.in</a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-gray-800 text-center flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm m-0">
            &copy; {new Date().getFullYear()} AArambh Rehabilitation Care Services. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm m-0">
            A New Beginning in Care.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
