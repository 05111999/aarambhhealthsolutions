import React from 'react';
import { motion } from 'framer-motion';

const SectionHeader = ({ eyebrow, title, subtitle, className = '', alignment = 'center' }) => {
  const alignClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6 }}
      className={`max-w-3xl mb-12 ${alignClass} ${className}`}
    >
      {eyebrow && (
        <span className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-3">{eyebrow}</span>
      )}
      <h2 className="text-text-dark mb-4">{title}</h2>
      {subtitle && <p className="text-text-muted text-lg">{subtitle}</p>}
    </motion.div>
  );
};

export default SectionHeader;
