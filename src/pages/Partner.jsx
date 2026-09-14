import React from 'react';
import { Building2, Users, CheckCircle, Award, Send } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import { partnershipModels } from '../data/mockData';
import Button from '../components/common/Button';

const Partner = () => {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-light-blue text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white mb-6">Let's Build Better Rehabilitation Together</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Partner with AArambh to elevate the standard of care in your facility. We offer flexible B2B partnership models tailored to hospitals, clinics, and care centers.
          </p>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-12 border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 text-center">
            <div>
              <h3 className="text-4xl text-teal font-bold mb-2">10+</h3>
              <p className="text-text-muted font-medium uppercase tracking-wide text-sm">Hospitals Partnered</p>
            </div>
            <div>
              <h3 className="text-4xl text-teal font-bold mb-2">50+</h3>
              <p className="text-text-muted font-medium uppercase tracking-wide text-sm">Staff Deployed</p>
            </div>
            <div>
              <h3 className="text-4xl text-teal font-bold mb-2">100%</h3>
              <p className="text-text-muted font-medium uppercase tracking-wide text-sm">Compliance Rate</p>
            </div>
          </div>
        </div>
      </section>

      {/* Partnership Models */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Partnership Models" 
            subtitle="Choose the integration model that best fits your institution's operational needs."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {partnershipModels.map((model, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-sm border border-border flex flex-col">
                <h3 className="text-2xl text-primary mb-4">{model.title}</h3>
                <p className="text-text-muted mb-6 flex-grow">{model.description}</p>
                <ul className="space-y-3 mt-auto pt-6 border-t border-border">
                  {model.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-teal" />
                      <span className="text-sm font-medium text-text-dark">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="lg:w-1/2">
              <h2 className="mb-6">Benefits of Partnering with AArambh</h2>
              <p className="text-text-muted mb-8">
                Outsourcing your rehabilitation department to AArambh brings specialized expertise directly to your facility, reducing overhead and improving patient outcomes.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Award className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Quality Assurance</h4>
                    <p className="text-text-muted text-sm">Standardized protocols and regular clinical audits ensure top-tier care delivery.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Users className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Zero Staffing Hassles</h4>
                    <p className="text-text-muted text-sm">We handle recruitment, training, leaves, and replacements of therapy staff.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <Building2 className="text-primary" size={24} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold mb-1">Infrastructure Consulting</h4>
                    <p className="text-text-muted text-sm">Expert advice on space utilization and equipment procurement for maximum ROI.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
               <img 
                  src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800&h=600" 
                  alt="Medical professionals collaborating" 
                  className="rounded-2xl shadow-xl"
                />
            </div>
          </div>
        </div>
      </section>

      {/* Process & Form */}
      <section className="py-20 bg-bg border-t border-border">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Start the Conversation" 
            subtitle="Let's discuss how we can integrate our services into your facility."
          />
          
          <div className="flex flex-col lg:flex-row gap-12 max-w-6xl mx-auto">
            {/* Timeline */}
            <div className="lg:w-1/3">
              <h3 className="text-xl mb-8">Onboarding Process</h3>
              <div className="relative border-l-2 border-primary/20 pl-6 space-y-10">
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-primary rounded-full -left-[31px] top-1"></div>
                  <h4 className="font-bold text-text-dark">1. Initial Inquiry</h4>
                  <p className="text-sm text-text-muted mt-1">Submit your details through the form.</p>
                </div>
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-teal rounded-full -left-[31px] top-1"></div>
                  <h4 className="font-bold text-text-dark">2. Needs Assessment</h4>
                  <p className="text-sm text-text-muted mt-1">We evaluate your facility's requirements and capacity.</p>
                </div>
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-light-blue rounded-full -left-[31px] top-1"></div>
                  <h4 className="font-bold text-text-dark">3. Proposal & Agreement</h4>
                  <p className="text-sm text-text-muted mt-1">Customized model selection and contract signing.</p>
                </div>
                <div className="relative">
                  <div className="absolute w-4 h-4 bg-primary rounded-full -left-[31px] top-1"></div>
                  <h4 className="font-bold text-text-dark">4. Deployment</h4>
                  <p className="text-sm text-text-muted mt-1">Staff placement, protocol setup, and launch.</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:w-2/3 bg-white p-8 rounded-2xl shadow-sm border border-border">
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Organization Name *</label>
                    <input type="text" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Contact Person *</label>
                    <input type="text" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Designation</label>
                    <input type="text" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">City/Location *</label>
                    <input type="text" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Email Address *</label>
                    <input type="email" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Phone Number *</label>
                    <input type="tel" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Partnership Interest</label>
                  <select className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none bg-white">
                    <option>Select a model</option>
                    <option>Full Staffing Support</option>
                    <option>Therapy Consulting</option>
                    <option>Operational Partnership</option>
                    <option>Other / Not Sure Yet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Message</label>
                  <textarea rows="4" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none resize-none"></textarea>
                </div>

                <Button type="submit" icon={Send}>Submit Inquiry</Button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Partner;
