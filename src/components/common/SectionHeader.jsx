import React from 'react';

const SectionHeader = ({ title, subtitle, className = '', alignment = 'center' }) => {
  const alignClass = alignment === 'center' ? 'text-center mx-auto' : 'text-left';

  return (
    <div className={`max-w-3xl mb-12 ${alignClass} ${className}`}>
      <h2 className="text-text-dark mb-4">{title}</h2>
      {subtitle && <p className="text-text-muted text-lg">{subtitle}</p>}
    </div>
  );
};

export default SectionHeader;
