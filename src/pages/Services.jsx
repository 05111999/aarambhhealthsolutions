import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar } from 'lucide-react';
import { services } from '../data/mockData';
import Button from '../components/common/Button';
import PageHero from '../components/common/PageHero';
import { fadeUp } from '../lib/motion';

const Services = ({ onBookClick }) => {
  return (
    <div className="w-full bg-bg min-h-screen pb-24">
      <PageHero
        breadcrumbLabel="Services"
        eyebrow="What We Offer"
        title="Our Rehabilitation Services"
        subtitle="Comprehensive, evidence-based therapy programs tailored to your unique recovery journey — across every discipline our team specializes in."
      />

      <div className="container mx-auto px-4 space-y-8 mt-16">
        {services.map((service, index) => {
          const Icon = service.icon;
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={service.id}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={fadeUp}
              className="bg-white rounded-2xl border border-border/50 overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-shadow duration-300"
              id={service.id}
            >
              <div className="flex flex-col lg:flex-row">
                {/* Visual / Title Side */}
                <div className={`lg:w-1/3 p-8 md:p-12 bg-gradient-to-br ${isEven ? 'from-bg to-white' : 'from-primary/5 to-white'} border-b lg:border-b-0 lg:border-r border-border/50 flex flex-col justify-center items-start`}>
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
                    <Icon size={30} className="text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-text-dark mb-4">{service.title}</h2>
                  <p className="text-text-muted text-lg mb-8">{service.shortDescription}</p>

                  <div className="flex flex-col gap-3 w-full mt-auto">
                    <Button onClick={onBookClick} icon={Calendar} className="w-full">
                      Book for This Service
                    </Button>
                    <Button variant="outline" className="w-full !border-border !text-text-dark hover:!bg-bg" to={`/services/${service.id}`}>
                      View Full Details
                    </Button>
                  </div>
                </div>

                {/* Details Side */}
                <div className="lg:w-2/3 p-8 md:p-12">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
                    {/* Conditions & Benefits */}
                    <div>
                      <h4 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Conditions Treated</h4>
                      <ul className="space-y-3 mb-8">
                        {service.conditions.map((condition, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal mt-2 flex-shrink-0" />
                            <span className="text-text-muted">{condition}</span>
                          </li>
                        ))}
                      </ul>

                      <h4 className="text-sm font-bold text-primary mb-4 uppercase tracking-widest">Key Benefits</h4>
                      <ul className="space-y-3">
                        {service.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle size={18} className="text-teal mt-0.5 flex-shrink-0" />
                            <span className="text-text-muted">{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Treatment Process */}
                    <div className="bg-bg rounded-xl p-6 border border-border/50">
                      <h4 className="text-sm font-bold text-primary mb-6 uppercase tracking-widest">Treatment Process</h4>
                      <div className="space-y-4">
                        {service.process.map((step, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-primary to-teal text-white font-bold text-xs shadow shrink-0">
                              {idx + 1}
                            </div>
                            <div className="bg-white flex-1 px-4 py-2.5 rounded-lg shadow-sm border border-border/50 text-sm font-medium text-text-dark">
                              {step}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
