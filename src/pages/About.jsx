import React from 'react';
import { motion } from 'framer-motion';
import { Heart, Brain, ShieldCheck, Award } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import { team } from '../data/mockData';

const About = () => {
  return (
    <div className="w-full">
      {/* 1. Hero / Breadcrumb */}
      <section className="bg-gradient-to-r from-primary to-light-blue text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white mb-4">About AArambh</h1>
          <p className="text-white/80 text-sm tracking-wide uppercase font-medium">
            Home <span className="mx-2">&gt;</span> About Us
          </p>
        </div>
      </section>

      {/* 2. Founder Story */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-teal -translate-x-4 translate-y-4 rounded-2xl"></div>
                <img 
                  src="https://images.unsplash.com/photo-1551076805-e1869033e561?auto=format&fit=crop&q=80&w=800&h=600" 
                  alt="Founder of AArambh" 
                  className="relative z-10 rounded-2xl w-full h-auto object-cover shadow-lg"
                />
              </div>
            </div>
            <div className="lg:w-1/2">
              <h2 className="text-primary mb-6">Our Founding Vision</h2>
              <p className="text-text-muted mb-4">
                AArambh was born out of a simple yet profound realization: rehabilitation is not just about physical recovery, but about reclaiming one's life. 
              </p>
              <p className="text-text-muted mb-4">
                Years ago, after witnessing the disjointed and often impersonal nature of standard therapy services, our founders set out to create a sanctuary of healing. They envisioned a place where every patient is treated as an individual, with a personalized roadmap to recovery that addresses physical, emotional, and psychological needs.
              </p>
              <p className="text-text-muted font-medium text-text-dark border-l-4 border-teal pl-4 italic">
                "Our mission is to provide a new beginning—a structured, compassionate, and scientifically backed approach to helping our patients return to the lives they love."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Mission, Vision, Values */}
      <section className="py-20 bg-bg">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Our Core Philosophy" 
            subtitle="The principles that guide our every interaction and treatment plan."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="text-primary" size={32} />
              </div>
              <h3 className="mb-4">Our Mission</h3>
              <p className="text-text-muted">To deliver world-class, compassionate rehabilitation services that empower individuals to overcome physical limitations and achieve lasting independence.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="text-primary" size={32} />
              </div>
              <h3 className="mb-4">Our Vision</h3>
              <p className="text-text-muted">To be the most trusted and innovative rehabilitation care provider in Odisha, setting new standards for patient outcomes and institutional partnerships.</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm border border-border text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="text-primary" size={32} />
              </div>
              <h3 className="mb-4">Our Values</h3>
              <p className="text-text-muted">Empathy in action, uncompromised professional ethics, evidence-based practices, and a steadfast commitment to continuous improvement.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Meet the Team */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Meet Our Expert Team" 
            subtitle="Dedicated professionals bringing years of specialized experience to your recovery."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member) => (
              <div key={member.id} className="group">
                <div className="relative overflow-hidden rounded-xl mb-4 aspect-square">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <h3 className="text-xl font-bold text-text-dark mb-1">{member.name}</h3>
                <p className="text-primary font-medium text-sm mb-1">{member.designation}</p>
                <p className="text-text-muted text-sm">{member.specialization}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Certifications */}
      <section className="py-16 bg-bg border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl font-semibold mb-8 text-text-muted">Recognized & Certified By</h3>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60">
            <div className="flex items-center gap-2"><Award size={32} /> <span className="font-bold text-lg">Health Authority</span></div>
            <div className="flex items-center gap-2"><Award size={32} /> <span className="font-bold text-lg">Rehab Council</span></div>
            <div className="flex items-center gap-2"><Award size={32} /> <span className="font-bold text-lg">ISO 9001:2015</span></div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
