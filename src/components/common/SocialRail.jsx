import React from 'react';
import { motion } from 'framer-motion';
// lucide-react's 1.x line dropped brand/logo icons entirely — react-icons (Font
// Awesome 6 set) is the maintained source for these, and already a dependency here.
import { FaFacebook, FaInstagram, FaXTwitter, FaLinkedin } from 'react-icons/fa6';

const socialLinks = [
  { icon: FaFacebook, href: '#', label: 'Facebook' },
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaXTwitter, href: '#', label: 'X (Twitter)' },
  { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
];

// Floating vertical social rail — hidden on smaller screens (below lg) to avoid
// crowding the WhatsApp button and page content; the footer still carries the
// same links for mobile visitors.
const SocialRail = () => {
  return (
    <div className="hidden lg:flex fixed right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-3">
      <div className="w-px h-10 bg-gradient-to-b from-transparent to-border" />
      {socialLinks.map(({ icon: Icon, href, label }, i) => (
        <motion.a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.1 + i * 0.08, type: 'spring', stiffness: 200 }}
          whileHover={{ scale: 1.12, x: -2 }}
          whileTap={{ scale: 0.92 }}
          className="w-10 h-10 rounded-full bg-white border border-border shadow-sm shadow-primary/5 flex items-center justify-center text-text-muted hover:bg-gradient-to-br hover:from-primary hover:to-teal hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
        >
          <Icon size={17} />
        </motion.a>
      ))}
      <div className="w-px h-10 bg-gradient-to-t from-transparent to-border" />
    </div>
  );
};

export default SocialRail;
