import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// Shared modern header for every inner page — dark navy, dot-grid texture, soft
// gradient blobs, replacing the old flat "bg-gradient-to-r" bar used everywhere.
const PageHero = ({ eyebrow, title, subtitle, breadcrumbLabel, children, compact = false }) => {
  return (
    <section className={`relative overflow-hidden bg-[#0A2540] ${compact ? 'py-16' : 'py-20 md:py-24'}`}>
      <div
        className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
      />
      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-10 right-[10%] w-72 h-72 bg-teal/20 rounded-full blur-3xl"
      />
      <div className="absolute bottom-0 left-[6%] w-80 h-80 bg-primary/25 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {breadcrumbLabel && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-1.5 text-sm text-white/50 mb-6"
          >
            <Link to="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <ChevronRight size={14} />
            <span className="text-white/80 font-medium">{breadcrumbLabel}</span>
          </motion.div>
        )}

        {eyebrow && (
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-4"
          >
            {eyebrow}
          </motion.span>
        )}

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-white text-[clamp(32px,5vw,52px)] leading-tight font-bold mb-4 max-w-3xl"
        >
          {title}
        </motion.h1>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-lg max-w-2xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}

        {children && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6"
          >
            {children}
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default PageHero;
