import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
// lucide-react's 1.x line dropped brand/logo icons entirely — react-icons (Font
// Awesome 6 set) is the maintained source for these, and already a dependency here.
import { FaFacebook, FaInstagram, FaLinkedin, FaXTwitter } from 'react-icons/fa6';

const socialLinks = [
  { icon: FaFacebook, href: '#' },
  { icon: FaXTwitter, href: '#' },
  { icon: FaInstagram, href: '#' },
  { icon: FaLinkedin, href: '#' },
];

const serviceLinks = [
  { label: 'Physiotherapy', path: '/services/physiotherapy' },
  { label: 'Occupational Therapy', path: '/services/occupational-therapy' },
  { label: 'Speech Therapy', path: '/services/speech-therapy' },
  { label: 'Neuro Rehabilitation', path: '/services/neuro-rehabilitation' },
  { label: 'Pediatric Rehabilitation', path: '/services/pediatric-rehabilitation' },
  { label: 'Homecare Services', path: '/services/homecare-services' },
];

const companyLinks = [
  { label: 'About Us', path: '/about' },
  { label: 'Partner With Us', path: '/partner' },
  { label: 'Careers', path: '/careers' },
  { label: 'Contact Us', path: '/contact' },
];

const Footer = () => {
  return (
    <footer className="relative bg-[#0A2540] text-white pt-20 pb-8 overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-teal to-transparent" />
      <div
        className="absolute inset-0 opacity-[0.15] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_60%,transparent_100%)]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand Col */}
          <div>
            <Link to="/" className="flex items-center gap-3 mb-6 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal rounded-xl blur-sm opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="relative bg-gradient-to-br from-primary to-teal p-2.5 rounded-xl">
                  <Heart size={22} className="text-white fill-white/30" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold leading-none text-white m-0 p-0">AArambh</h2>
                <span className="text-[10px] text-teal uppercase tracking-wider font-semibold block mt-1">Rehabilitation Care</span>
              </div>
            </Link>
            <p className="text-white/50 text-sm mb-6 max-w-xs leading-relaxed">
              A New Beginning in Care. Providing compassionate, ethical, and trustworthy rehabilitation services across Odisha.
            </p>
            <div className="flex gap-3">
              {socialLinks.map(({ icon: Icon, href }, i) => (
                <a
                  key={i}
                  href={href}
                  className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:bg-gradient-to-br hover:from-primary hover:to-teal hover:text-white hover:border-transparent transition-all"
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Services Col */}
          <div>
            <h4 className="text-sm font-semibold mb-6 text-white/90 uppercase tracking-wide">Our Services</h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/50 hover:text-teal transition-colors text-sm inline-flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links Col */}
          <div>
            <h4 className="text-sm font-semibold mb-6 text-white/90 uppercase tracking-wide">Company</h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="text-white/50 hover:text-teal transition-colors text-sm inline-flex items-center gap-1 group">
                    {link.label}
                    <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Col */}
          <div>
            <h4 className="text-sm font-semibold mb-6 text-white/90 uppercase tracking-wide">Contact Info</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="bg-white/5 p-2 rounded-lg shrink-0">
                  <MapPin size={16} className="text-teal" />
                </div>
                <span className="text-white/50 text-sm leading-relaxed pt-1">123 Health Avenue, Khandagiri, Bhubaneswar, Odisha 751030</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-white/5 p-2 rounded-lg shrink-0">
                  <Phone size={16} className="text-teal" />
                </div>
                <a href="tel:+919876543210" className="text-white/50 hover:text-white transition-colors text-sm">+91 98765 43210</a>
              </li>
              <li className="flex items-center gap-3">
                <div className="bg-white/5 p-2 rounded-lg shrink-0">
                  <Mail size={16} className="text-teal" />
                </div>
                <a href="mailto:care@aarambh.in" className="text-white/50 hover:text-white transition-colors text-sm">care@aarambh.in</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-white/40 text-sm m-0">
            &copy; {new Date().getFullYear()} AArambh Rehabilitation Care Services. All rights reserved.
          </p>
          <p className="text-white/40 text-sm m-0">A New Beginning in Care.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
