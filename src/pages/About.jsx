import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, ShieldCheck, Award, Quote } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import PageHero from '../components/common/PageHero';
import { team } from '../data/mockData';
import { fadeUp, staggerContainer } from '../lib/motion';

const values = [
  { icon: Heart, title: 'Our Mission', desc: 'To deliver world-class, compassionate rehabilitation services that empower individuals to overcome physical limitations and achieve lasting independence.' },
  { icon: Brain, title: 'Our Vision', desc: 'To be the most trusted and innovative rehabilitation care provider in Odisha, setting new standards for patient outcomes and institutional partnerships.' },
  { icon: ShieldCheck, title: 'Our Values', desc: 'Empathy in action, uncompromised professional ethics, evidence-based practices, and a steadfast commitment to continuous improvement.' },
];

const certifications = ['Health Authority', 'Rehab Council', 'ISO 9001:2015'];

const About = () => {
  return (
    <div className="w-full">
      <PageHero
        breadcrumbLabel="About Us"
        eyebrow="Who We Are"
        title="A New Beginning in Rehabilitation Care"
        subtitle="Discover the story, philosophy, and people behind AArambh's commitment to compassionate, evidence-based recovery."
      />

      {/* Founder Story */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7 }}
              className="lg:w-1/2"
            >
              <div className="relative">
                <div className="absolute -inset-3 bg-gradient-to-br from-teal/20 to-primary/20 rounded-[2rem] blur-xl" />
                <div className="absolute -bottom-5 -right-5 w-28 h-28 bg-gradient-to-br from-primary to-teal rounded-2xl opacity-20" />
                <img
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800&h=600"
                  alt="Founder of AArambh"
                  className="relative z-10 rounded-2xl w-full h-auto object-cover shadow-xl"
                />
              </div>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              className="lg:w-1/2"
            >
              <span className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-4">Our Story</span>
              <h2 className="text-text-dark mb-6 leading-tight">Our Founding Vision</h2>
              <p className="text-text-muted mb-4 leading-relaxed">
                AArambh was born out of a simple yet profound realization: rehabilitation is not just about physical recovery, but about reclaiming one's life.
              </p>
              <p className="text-text-muted mb-6 leading-relaxed">
                Years ago, after witnessing the disjointed and often impersonal nature of standard therapy services, our founders set out to create a sanctuary of healing. They envisioned a place where every patient is treated as an individual, with a personalized roadmap to recovery that addresses physical, emotional, and psychological needs.
              </p>
              <div className="bg-bg rounded-2xl p-6 border-l-4 border-teal relative">
                <Quote size={28} className="text-teal/30 absolute top-4 right-4" />
                <p className="text-text-dark font-medium italic leading-relaxed">
                  "Our mission is to provide a new beginning — a structured, compassionate, and scientifically backed approach to helping our patients return to the lives they love."
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Our Philosophy" title="The Principles That Guide Us" subtitle="What shapes every interaction and treatment plan we design." />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                variants={fadeUp}
                custom={i}
                className="bg-white p-8 rounded-2xl border border-border/50 text-center hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-teal rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <v.icon className="text-white" size={28} />
                </div>
                <h3 className="mb-3">{v.title}</h3>
                <p className="text-text-muted leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Our People" title="Meet Our Expert Team" subtitle="Dedicated professionals bringing years of specialized experience to your recovery." />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {team.map((member, i) => (
              <motion.div key={member.id} variants={fadeUp} custom={i} className="group">
                <div className="relative overflow-hidden rounded-2xl mb-4 aspect-square shadow-sm">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A2540]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-lg font-bold text-text-dark mb-1">{member.name}</h3>
                <p className="text-primary font-medium text-sm mb-1">{member.designation}</p>
                <p className="text-text-muted text-sm">{member.specialization}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-bg border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-text-muted text-sm font-semibold uppercase tracking-widest mb-8">Recognized &amp; Certified By</p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-6"
          >
            {certifications.map((cert, i) => (
              <motion.div
                key={cert}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-2.5 bg-white border border-border rounded-full px-6 py-3 shadow-sm"
              >
                <Award size={20} className="text-teal" />
                <span className="font-semibold text-text-dark text-sm">{cert}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default About;
