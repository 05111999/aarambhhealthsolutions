import React from 'react';
import Button from './Button';
import { Phone, Calendar } from 'lucide-react';

const CtaBanner = ({ onBookClick }) => {
  return (
    <section className="py-16 bg-gradient-to-r from-primary to-light-blue text-white text-center relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="cta-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="2" fill="currentColor" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="url(#cta-pattern)" />
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <h2 className="text-white mb-4">Ready to Start Your Recovery Journey?</h2>
        <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
          Contact us today to schedule a consultation or learn more about how our expert team can help you achieve your rehabilitation goals.
        </p>
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
          <Button variant="white" onClick={onBookClick} icon={Calendar}>
            Book Appointment
          </Button>
          <Button variant="outline" to="/contact" icon={Phone}>
            Call Us Now
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaBanner;
