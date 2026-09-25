import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { services } from '../data/mockData';
import Button from '../components/common/Button';
import { fadeUp, staggerContainer } from '../lib/motion';

const ServiceDetail = ({ onBookClick }) => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const service = services.find((s) => s.id === slug);
  const relatedServices = services.filter((s) => s.id !== slug).slice(0, 3);

  useEffect(() => {
    if (!service) {
      navigate('/services');
    }
  }, [service, navigate]);

  if (!service) return null;

  const Icon = service.icon;

  return (
    <div className="w-full bg-bg min-h-screen pb-24">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0A2540] py-20">
        <div
          className="absolute inset-0 opacity-[0.25] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)]"
          style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute -top-10 right-[10%] w-72 h-72 bg-teal/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-[6%] w-80 h-80 bg-primary/25 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 relative z-10">
          <Link to="/services" className="inline-flex items-center text-white/60 hover:text-white mb-8 transition-colors text-sm">
            <ArrowLeft size={18} className="mr-2" /> Back to All Services
          </Link>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col md:flex-row items-start md:items-center gap-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-teal rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <Icon size={38} className="text-white" />
            </div>
            <div>
              <h1 className="text-white mb-2">{service.title}</h1>
              <p className="text-white/70 text-lg max-w-2xl">{service.shortDescription}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={fadeUp}
            className="lg:w-2/3"
          >
            <div className="bg-white rounded-2xl p-8 md:p-12 border border-border/50 mb-8">
              <h2 className="mb-6">Overview</h2>
              <p className="text-text-muted mb-8 leading-relaxed">
                Our {service.title.toLowerCase()} program is designed to provide comprehensive, individualized care.
                We utilize evidence-based practices to help patients regain function, reduce pain, and improve their overall quality of life.
                Our team of certified professionals works closely with each patient to develop a treatment plan that addresses their unique needs and goals.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
                <div>
                  <h3 className="text-xl mb-4 text-primary">Conditions We Treat</h3>
                  <ul className="space-y-3">
                    {service.conditions.map((condition, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-teal mt-2 flex-shrink-0" />
                        <span className="text-text-muted">{condition}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-xl mb-4 text-primary">Program Benefits</h3>
                  <ul className="space-y-3">
                    {service.benefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <CheckCircle size={20} className="text-teal mt-0.5 flex-shrink-0" />
                        <span className="text-text-muted">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <h3 className="text-2xl mb-6 border-b border-border pb-4">The Treatment Process</h3>
              <div className="space-y-6">
                {service.process.map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal text-white flex items-center justify-center font-bold shrink-0 shadow-md">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-text-dark mb-1">{step}</h4>
                      <p className="text-text-muted text-sm">
                        Detailed execution of the {step.toLowerCase()} phase, ensuring patient comfort and clinical accuracy at every step of the journey.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Sidebar Area */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="lg:w-1/3 space-y-8"
          >
            {/* CTA Card */}
            <motion.div variants={fadeUp} className="bg-gradient-to-br from-primary to-teal rounded-2xl p-8 text-white shadow-xl shadow-primary/20 sticky top-24">
              <h3 className="text-white mb-4">Need this service?</h3>
              <p className="text-white/90 mb-6 text-sm leading-relaxed">
                Book a consultation today to have our experts assess your requirements and build a personalized plan.
              </p>
              <Button variant="white" className="w-full" onClick={onBookClick} icon={Calendar}>
                Book Consultation
              </Button>
            </motion.div>

            {/* Related Services */}
            <motion.div variants={fadeUp} className="bg-white rounded-2xl p-8 border border-border/50">
              <h3 className="text-xl mb-6">Other Services</h3>
              <div className="space-y-2">
                {relatedServices.map((rs) => {
                  const RSIcon = rs.icon;
                  return (
                    <Link
                      to={`/services/${rs.id}`}
                      key={rs.id}
                      className="flex items-center gap-4 p-3 rounded-xl hover:bg-bg transition-colors border border-transparent hover:border-border/50 group"
                    >
                      <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-teal group-hover:text-white transition-all shrink-0">
                        <RSIcon size={20} />
                      </div>
                      <h4 className="font-semibold text-text-dark text-sm">{rs.title}</h4>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
