import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Calendar } from 'lucide-react';
import { services } from '../data/mockData';
import Button from '../components/common/Button';

const Services = ({ onBookClick }) => {
  return (
    <div className="w-full bg-bg min-h-screen pb-20">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-light-blue text-white py-16 mb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white mb-4">Our Rehabilitation Services</h1>
          <p className="text-white/80 text-sm tracking-wide uppercase font-medium">
            Home <span className="mx-2">&gt;</span> Services
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-16">
        {services.map((service, index) => {
          const Icon = service.icon;
          const isEven = index % 2 === 0;

          return (
            <div 
              key={service.id} 
              className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden"
              id={service.id}
            >
              <div className="flex flex-col lg:flex-row">
                
                {/* Visual / Title Side */}
                <div className={`lg:w-1/3 p-8 md:p-12 bg-gradient-to-br ${isEven ? 'from-bg to-white' : 'from-primary/5 to-white'} border-b lg:border-b-0 lg:border-r border-border flex flex-col justify-center items-start`}>
                  <div className="w-16 h-16 bg-teal text-white rounded-xl flex items-center justify-center mb-6 shadow-md">
                    <Icon size={32} />
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
                      <h4 className="text-lg font-bold text-primary mb-4 uppercase tracking-wide text-sm">Conditions Treated</h4>
                      <ul className="space-y-3 mb-8">
                        {service.conditions.map((condition, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-teal mt-2 flex-shrink-0"></div>
                            <span className="text-text-muted">{condition}</span>
                          </li>
                        ))}
                      </ul>

                      <h4 className="text-lg font-bold text-primary mb-4 uppercase tracking-wide text-sm">Key Benefits</h4>
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
                    <div className="bg-bg rounded-xl p-6 border border-border">
                      <h4 className="text-lg font-bold text-primary mb-6 uppercase tracking-wide text-sm">Treatment Process</h4>
                      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
                        {service.process.map((step, idx) => (
                          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-teal text-white font-bold text-xs shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 relative">
                              {idx + 1}
                            </div>
                            <div className="w-[calc(100%-3rem)] md:w-[calc(50%-2rem)] bg-white p-3 rounded-lg shadow-sm border border-border text-sm font-medium text-text-dark">
                              {step}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Services;
