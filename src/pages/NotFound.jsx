import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Search, Phone, ArrowRight } from 'lucide-react';
import { fadeUp, staggerContainer } from '../lib/motion';

const quickLinks = [
  { label: 'Our Services', path: '/services', icon: Search },
  { label: 'Contact Us', path: '/contact', icon: Phone },
];

const NotFound = () => {
  return (
    <section className="relative min-h-[calc(100vh-72px)] flex items-center overflow-hidden bg-[#0A2540]">
      <div
        className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000_60%,transparent_100%)]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 right-[10%] w-72 h-72 bg-teal/20 rounded-full blur-3xl"
      />
      <div className="absolute bottom-0 left-[6%] w-80 h-80 bg-primary/25 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="max-w-xl mx-auto text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-[clamp(80px,15vw,140px)] font-bold leading-none bg-gradient-to-r from-teal to-primary bg-clip-text text-transparent mb-4"
          >
            404
          </motion.p>
          <motion.h1 variants={fadeUp} className="text-white text-[clamp(24px,4vw,36px)] font-bold mb-4">
            Page Not Found
          </motion.h1>
          <motion.p variants={fadeUp} className="text-white/60 text-lg mb-10 leading-relaxed">
            The page you're looking for doesn't exist or may have been moved. Let's get you back on track.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-8 py-4 rounded-xl hover:shadow-lg hover:shadow-teal/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              <Home size={18} />
              Back to Home
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-center gap-4">
            {quickLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm font-medium px-5 py-2.5 rounded-full hover:bg-white/20 transition-all duration-300 group"
              >
                <link.icon size={15} />
                {link.label}
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default NotFound;
