import React from 'react';
import { motion } from 'framer-motion';
import CountUp from 'react-countup';
import { Building2, Users, CheckCircle, Award, Send } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import PageHero from '../components/common/PageHero';
import { partnershipModels } from '../data/mockData';
import Button from '../components/common/Button';
import { fadeUp, staggerContainer } from '../lib/motion';

const stats = [
  { value: 10, suffix: '+', label: 'Hospitals Partnered' },
  { value: 50, suffix: '+', label: 'Staff Deployed' },
  { value: 100, suffix: '%', label: 'Compliance Rate' },
];

const benefits = [
  { icon: Award, title: 'Quality Assurance', desc: 'Standardized protocols and regular clinical audits ensure top-tier care delivery.' },
  { icon: Users, title: 'Zero Staffing Hassles', desc: 'We handle recruitment, training, leaves, and replacements of therapy staff.' },
  { icon: Building2, title: 'Infrastructure Consulting', desc: 'Expert advice on space utilization and equipment procurement for maximum ROI.' },
];

const timeline = [
  { step: '1', title: 'Initial Inquiry', desc: 'Submit your details through the form.' },
  { step: '2', title: 'Needs Assessment', desc: "We evaluate your facility's requirements and capacity." },
  { step: '3', title: 'Proposal & Agreement', desc: 'Customized model selection and contract signing.' },
  { step: '4', title: 'Deployment', desc: 'Staff placement, protocol setup, and launch.' },
];

const inputClasses = 'w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

const Partner = () => {
  return (
    <div className="w-full">
      <PageHero
        eyebrow="B2B Partnerships"
        title="Let's Build Better Rehabilitation Together"
        subtitle="Partner with AArambh to elevate the standard of care in your facility. We offer flexible B2B partnership models tailored to hospitals, clinics, and care centers."
      />

      {/* Trust Indicators */}
      <section className="bg-white py-14 border-b border-border/50 relative -mt-1">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-10 md:gap-20 text-center"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp}>
                <h3 className="text-4xl bg-gradient-to-r from-primary to-teal bg-clip-text text-transparent font-bold mb-2">
                  <CountUp end={s.value} duration={2} suffix={s.suffix} enableScrollSpy scrollSpyOnce />
                </h3>
                <p className="text-text-muted font-medium uppercase tracking-wide text-sm">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Partnership Models */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Choose Your Fit" title="Partnership Models" subtitle="Choose the integration model that best fits your institution's operational needs." />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {partnershipModels.map((model, i) => (
              <motion.div
                key={model.title}
                variants={fadeUp}
                custom={i}
                className="bg-white p-8 rounded-2xl border border-border/50 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 flex flex-col"
              >
                <h3 className="text-2xl text-primary mb-4">{model.title}</h3>
                <p className="text-text-muted mb-6 flex-grow leading-relaxed">{model.description}</p>
                <ul className="space-y-3 mt-auto pt-6 border-t border-border/50">
                  {model.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle size={18} className="text-teal shrink-0" />
                      <span className="text-sm font-medium text-text-dark">{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              className="lg:w-1/2"
            >
              <span className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-4">Why Partner</span>
              <h2 className="mb-6">Benefits of Partnering with AArambh</h2>
              <p className="text-text-muted mb-8 leading-relaxed">
                Outsourcing your rehabilitation department to AArambh brings specialized expertise directly to your facility, reducing overhead and improving patient outcomes.
              </p>
              <div className="space-y-6">
                {benefits.map((b) => (
                  <div key={b.title} className="flex gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-teal/10 rounded-xl flex items-center justify-center shrink-0">
                      <b.icon className="text-primary" size={22} />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold mb-1">{b.title}</h4>
                      <p className="text-text-muted text-sm leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
              className="lg:w-1/2 relative"
            >
              <div className="absolute -inset-3 bg-gradient-to-br from-teal/20 to-primary/20 rounded-[2rem] blur-xl" />
              <img
                src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800&h=600"
                alt="Medical professionals collaborating"
                className="relative z-10 rounded-2xl shadow-xl w-full"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Process & Form */}
      <section className="py-24 bg-bg border-t border-border/50">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Get Started" title="Start the Conversation" subtitle="Let's discuss how we can integrate our services into your facility." />

          <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto">
            {/* Timeline */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={staggerContainer}
              className="md:w-1/3"
            >
              <h3 className="text-xl mb-8">Onboarding Process</h3>
              <div className="relative pl-2 space-y-8">
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gradient-to-b from-primary via-teal to-primary/20" />
                {timeline.map((t) => (
                  <motion.div key={t.step} variants={fadeUp} className="relative flex gap-5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-teal text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md z-10">
                      {t.step}
                    </div>
                    <div className="pt-1.5">
                      <h4 className="font-bold text-text-dark">{t.title}</h4>
                      <p className="text-sm text-text-muted mt-1">{t.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Form */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.6 }}
              className="md:w-2/3 bg-white p-8 rounded-2xl border border-border/50"
            >
              <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Organization Name *</label>
                    <input type="text" className={inputClasses} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Contact Person *</label>
                    <input type="text" className={inputClasses} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Designation</label>
                    <input type="text" className={inputClasses} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">City/Location *</label>
                    <input type="text" className={inputClasses} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Email Address *</label>
                    <input type="email" className={inputClasses} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Phone Number *</label>
                    <input type="tel" className={inputClasses} required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Partnership Interest</label>
                  <select className={`${inputClasses} bg-white`}>
                    <option>Select a model</option>
                    <option>Full Staffing Support</option>
                    <option>Therapy Consulting</option>
                    <option>Operational Partnership</option>
                    <option>Other / Not Sure Yet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Message</label>
                  <textarea rows="4" className={`${inputClasses} resize-none`} />
                </div>

                <Button type="submit" icon={Send}>
                  Submit Inquiry
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Partner;
