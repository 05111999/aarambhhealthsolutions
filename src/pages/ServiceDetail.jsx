import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, CheckCircle } from 'lucide-react';
import { services } from '../data/mockData';
import Button from '../components/common/Button';

const ServiceDetail = ({ onBookClick }) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const service = services.find(s => s.id === slug);
  const relatedServices = services.filter(s => s.id !== slug).slice(0, 3);

  useEffect(() => {
    if (!service) {
      navigate('/services');
    }
  }, [service, navigate]);

  if (!service) return null;

  const Icon = service.icon;

  return (
    <div className="w-full bg-bg min-h-screen pb-20">
      {/* Hero Section */}
      <section className="bg-primary text-white py-20">
        <div className="container mx-auto px-4">
          <Link to="/services" className="inline-flex items-center text-white/80 hover:text-white mb-8 transition-colors">
            <ArrowLeft size={20} className="mr-2" /> Back to All Services
          </Link>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
              <Icon size={40} className="text-teal" />
            </div>
            <div>
              <h1 className="text-white mb-2">{service.title}</h1>
              <p className="text-white/80 text-lg max-w-2xl">{service.shortDescription}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Main Content Area */}
          <div className="lg:w-2/3">
            <div className="bg-white rounded-2xl p-8 md:p-12 shadow-sm border border-border mb-8">
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
                        <div className="w-2 h-2 rounded-full bg-teal mt-2 flex-shrink-0"></div>
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
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
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
          </div>

          {/* Sidebar Area */}
          <div className="lg:w-1/3 space-y-8">
            {/* CTA Card */}
            <div className="bg-gradient-to-br from-teal to-light-blue rounded-2xl p-8 text-white shadow-lg sticky top-24">
              <h3 className="text-white mb-4">Need this service?</h3>
              <p className="text-white/90 mb-6 text-sm">
                Book a consultation today to have our experts assess your requirements and build a personalized plan.
              </p>
              <Button variant="white" className="w-full" onClick={onBookClick} icon={Calendar}>
                Book Consultation
              </Button>
            </div>

            {/* Related Services */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-border">
              <h3 className="text-xl mb-6">Other Services</h3>
              <div className="space-y-4">
                {relatedServices.map(rs => {
                  const RSIcon = rs.icon;
                  return (
                    <Link to={`/services/${rs.id}`} key={rs.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-bg transition-colors border border-transparent hover:border-border group">
                      <div className="w-10 h-10 bg-primary/10 rounded-md flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors shrink-0">
                        <RSIcon size={20} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-text-dark text-sm">{rs.title}</h4>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetail;
