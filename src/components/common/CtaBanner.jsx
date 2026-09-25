import React from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { Phone, Calendar } from 'lucide-react';
import { fadeUp } from '../../lib/motion';

const CtaBanner = ({ onBookClick }) => {
  return (
    <section className="relative py-20 bg-gradient-to-br from-[#0A2540] via-primary to-[#0A2540] text-center overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.2] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)]"
        style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '26px 26px' }}
      />
      <div className="absolute -top-10 left-[10%] w-72 h-72 bg-teal/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-10 right-[10%] w-80 h-80 bg-white/10 rounded-full blur-3xl" />

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeUp}
        className="container mx-auto px-4 relative z-10"
      >
        <h2 className="text-white mb-4">Ready to Start Your Recovery Journey?</h2>
        <p className="text-white/80 text-lg mb-8 max-w-2xl mx-auto">
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
      </motion.div>
    </section>
  );
};

export default CtaBanner;
