import React from 'react';
import CountUp from 'react-countup';
import autismHero from '../assets/autism.jpeg';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Activity, Building2, Stethoscope, Award, ShieldCheck, Heart, Star, CheckCircle, ArrowRight, Play, BadgeCheck } from 'lucide-react';
import Button from '../components/common/Button';
import SectionHeader from '../components/common/SectionHeader';
import CtaBanner from '../components/common/CtaBanner';
import Accordion from '../components/common/Accordion';
import { services, testimonials, faqs } from '../data/mockData';
import { fadeUp, staggerContainer } from '../lib/motion';

const Home = ({ onBookClick }) => {
  return (
    <div className="w-full overflow-hidden">

      {/* ─── 1. HERO ─── */}
      <section className="relative overflow-hidden bg-bg pt-16 pb-28 lg:pt-20 lg:pb-32">
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_20%,#000_60%,transparent_100%)]"
          style={{ backgroundImage: 'radial-gradient(circle, #0A6EBD26 1px, transparent 1px)', backgroundSize: '28px 28px' }}
        />

        {/* Ambient gradient blobs */}
        <motion.div
          animate={{ y: [0, -18, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-10 right-[8%] w-80 h-80 bg-teal/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          className="absolute bottom-0 left-[4%] w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-14 lg:gap-10 items-center">

            {/* ── Left: Copy ── */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2.5 bg-white border border-border rounded-full pl-3 pr-5 py-1.5 mb-7 shadow-sm shadow-primary/5"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal" />
                </span>
                <span className="text-text-dark text-sm font-medium">Now accepting new patients in Bhubaneswar</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="text-text-dark text-[clamp(38px,5vw,58px)] leading-[1.08] font-bold mb-6 text-balance"
              >
                Your Journey to{' '}
                <span className="relative inline-block">
                  <span className="relative z-10 bg-gradient-to-r from-primary via-light-blue to-teal bg-clip-text text-transparent">
                    Recovery
                  </span>
                  <svg className="absolute -bottom-1 left-0 w-full" height="10" viewBox="0 0 200 10" preserveAspectRatio="none">
                    <path d="M0,7 Q50,0 100,5 T200,4" stroke="url(#heroUnderline)" strokeWidth="4" fill="none" strokeLinecap="round" />
                    <defs>
                      <linearGradient id="heroUnderline" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#0A6EBD" />
                        <stop offset="100%" stopColor="#05AB9D" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{' '}
                Starts Here
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="text-text-muted text-lg md:text-xl mb-9 leading-relaxed"
              >
                Compassionate, evidence-based rehabilitation from a multidisciplinary team
                dedicated to helping you regain strength, independence, and confidence —
                one session at a time.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                className="flex flex-col sm:flex-row gap-4 mb-12"
              >
                <button
                  onClick={onBookClick}
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-primary to-teal text-white font-semibold px-8 py-4 rounded-xl hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5"
                >
                  Book Free Consultation
                  <ArrowRight size={18} />
                </button>
                <Link
                  to="/services"
                  className="inline-flex items-center justify-center gap-2 bg-white border border-border text-text-dark font-semibold px-8 py-4 rounded-xl hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
                >
                  <Play size={14} className="fill-primary text-primary" />
                  Explore Services
                </Link>
              </motion.div>

              {/* Animated stat row + social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="flex flex-wrap items-center gap-x-10 gap-y-6 pt-8 border-t border-border"
              >
                <div>
                  <p className="text-text-dark font-bold text-2xl leading-none">
                    <CountUp end={500} duration={2} delay={0.6} suffix="+" />
                  </p>
                  <p className="text-text-muted text-xs mt-1.5">Patients Served</p>
                </div>
                <div>
                  <p className="text-text-dark font-bold text-2xl leading-none">
                    <CountUp end={5} duration={2} delay={0.6} suffix="+ Yrs" />
                  </p>
                  <p className="text-text-muted text-xs mt-1.5">Experience</p>
                </div>
                <div>
                  <p className="text-text-dark font-bold text-2xl leading-none flex items-center gap-1">
                    <CountUp end={4.9} decimals={1} duration={2} delay={0.6} />
                    <Star size={16} className="text-teal fill-teal" />
                  </p>
                  <p className="text-text-muted text-xs mt-1.5">Patient Rating</p>
                </div>

                <div className="flex items-center gap-3 sm:ml-auto">
                  <div className="flex -space-x-3">
                    {[
                      { i: 'R', c: 'from-primary to-light-blue' },
                      { i: 'S', c: 'from-teal to-[#4dd0e1]' },
                      { i: 'A', c: 'from-light-blue to-teal' },
                      { i: 'M', c: 'from-primary to-teal' },
                    ].map((a, idx) => (
                      <div
                        key={idx}
                        className={`w-9 h-9 rounded-full bg-gradient-to-br ${a.c} border-2 border-white flex items-center justify-center text-white text-xs font-bold shadow-sm`}
                      >
                        {a.i}
                      </div>
                    ))}
                  </div>
                  <p className="text-text-muted text-xs leading-tight">
                    Joined by <span className="text-text-dark font-semibold">40+ families</span><br />this month
                  </p>
                </div>
              </motion.div>
            </div>

            {/* ── Right: Visual ── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="relative mx-auto max-w-md lg:max-w-none"
            >
              {/* Rotating dashed ring */}
              <motion.svg
                animate={{ rotate: 360 }}
                transition={{ duration: 26, repeat: Infinity, ease: 'linear' }}
                viewBox="0 0 200 200"
                className="absolute -top-10 -right-10 w-40 h-40 text-teal/30 hidden sm:block"
              >
                <circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
              </motion.svg>

              {/* Blurred accents behind image */}
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/15 to-teal/15 rounded-[2.5rem] blur-xl" />

              <div className="relative rounded-[2rem] overflow-hidden border-[6px] border-white shadow-2xl shadow-primary/15">
                <img
                  src={autismHero}
                  alt="Therapist guiding children through a rehabilitation session"
                  className="w-full h-[420px] sm:h-[480px] lg:h-[540px] object-cover"
                />
              </div>

              {/* Floating card: certified team */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="absolute -left-4 sm:-left-8 top-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-primary/10 border border-border/60 p-4 flex items-center gap-3 max-w-[220px]"
              >
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-teal flex items-center justify-center flex-shrink-0">
                  <BadgeCheck size={22} className="text-white" />
                </div>
                <div>
                  <p className="text-text-dark font-bold text-sm leading-tight">Certified Therapists</p>
                  <p className="text-text-muted text-xs mt-0.5">Licensed &amp; specialised</p>
                </div>
              </motion.div>

              {/* Floating card: rating */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 10 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ delay: 1.1, duration: 0.6 }}
                className="absolute -right-4 sm:-right-8 bottom-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl shadow-primary/10 border border-border/60 p-4 max-w-[200px]"
              >
                <div className="flex text-teal gap-0.5 mb-1.5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} size={13} className="fill-teal" />
                  ))}
                </div>
                <p className="text-text-dark font-bold text-sm leading-tight">4.9 out of 5</p>
                <p className="text-text-muted text-xs mt-0.5">From 500+ happy families</p>
              </motion.div>
            </motion.div>

          </div>
        </div>
      </section>


      {/* ─── 2. STATS RIBBON ─── */}
      <section className="relative mt-12 z-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border/50 p-8 grid grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: Activity, stat: '500+', label: 'Patients Served', color: 'from-teal to-emerald-400' },
              { icon: Building2, stat: '10+', label: 'Partner Institutions', color: 'from-primary to-blue-400' },
              { icon: Stethoscope, stat: '6', label: 'Therapy Disciplines', color: 'from-[#0594A8] to-teal' },
              { icon: Award, stat: '5+', label: 'Years Experience', color: 'from-amber-500 to-orange-400' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="flex items-center gap-4 group cursor-default"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 shadow-lg shadow-${item.color.split(' ')[0].slice(5)}/20 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-text-dark leading-none">{item.stat}</h3>
                  <p className="text-text-muted text-sm mt-1">{item.label}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ─── 3. ABOUT INTRO ─── */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-100px' }}
              variants={fadeUp}
              className="lg:w-1/2"
            >
              <span className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-4">Who We Are</span>
              <h2 className="text-text-dark mb-6 leading-tight">
                Committed to Your <span className="text-primary">Recovery</span> and Wellbeing
              </h2>
              <p className="text-text-muted mb-5 text-[17px] leading-relaxed">
                At AArambh Rehabilitation Care Services, we believe every patient deserves a tailored approach to recovery. Our philosophy is rooted in compassion, evidence-based practices, and unwavering professional ethics.
              </p>
              <p className="text-text-muted mb-8 text-[17px] leading-relaxed">
                Whether you're recovering from a sports injury, managing a neurological condition, or seeking pediatric therapy for your child, our experts are here to support you at every step.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                {['Personalized treatment plans', 'Evidence-based practices', 'Multidisciplinary team'].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-teal flex-shrink-0" />
                    <span className="text-sm text-text-dark font-medium">{item}</span>
                  </div>
                ))}
              </div>

              <Button to="/about" icon={ArrowRight}>
                Discover Our Story
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="lg:w-1/2"
            >
              <div className="relative">
                {/* Decorative blob */}
                <div className="absolute -inset-4 bg-gradient-to-br from-teal/20 to-primary/20 rounded-[2rem] blur-2xl" />
                {/* Decorative accent */}
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-gradient-to-br from-primary to-teal rounded-2xl opacity-20" />
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-teal/30 rounded-full blur-xl" />

                <img
                  src="/images/about-therapy.png"
                  alt="Therapist helping patient with rehabilitation"
                  className="relative z-10 rounded-2xl w-full h-[480px] object-cover shadow-2xl shadow-primary/10"
                />

                {/* Floating card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="absolute -bottom-6 -left-6 z-20 bg-white rounded-2xl shadow-xl p-5 border border-border/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal to-primary rounded-xl flex items-center justify-center">
                      <Heart size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-text-dark font-bold text-lg leading-none">98%</p>
                      <p className="text-text-muted text-xs mt-0.5">Patient Satisfaction</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─── 4. SERVICES GRID ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHeader
              title="Our Rehabilitation Services"
              subtitle="Comprehensive care tailored to meet your unique needs across various disciplines."
            />
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {services.map((service, i) => {
              const IconComponent = service.icon;
              return (
                <motion.div
                  key={service.id}
                  variants={fadeUp}
                  custom={i}
                  className="group relative bg-bg rounded-2xl p-8 border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-teal/10 rounded-2xl flex items-center justify-center mb-6 group-hover:from-primary group-hover:to-teal transition-all duration-300">
                    <IconComponent className="text-primary group-hover:text-white transition-colors duration-300" size={26} />
                  </div>
                  <h3 className="text-xl mb-3 font-semibold">{service.title}</h3>
                  <p className="text-text-muted text-[15px] mb-6 h-12 line-clamp-2">{service.shortDescription}</p>
                  <Link
                    to={`/services/${service.id}`}
                    className="inline-flex items-center gap-2 text-primary text-sm font-semibold hover:text-teal transition-colors group/link"
                  >
                    Learn More
                    <ArrowRight size={14} className="group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>


      {/* ─── 5. IMAGE BREAK + PEDIATRIC HIGHLIGHT ─── */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="/images/pediatric-therapy.png"
            alt="Child in a fun therapy session"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A2540]/85 to-[#0A2540]/50" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="max-w-2xl"
          >
            <span className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-4">Pediatric Rehabilitation</span>
            <h2 className="text-white text-[clamp(28px,4vw,44px)] leading-tight mb-6 font-bold">
              Helping Children <span className="text-teal">Thrive</span> Through Play-Based Therapy
            </h2>
            <p className="text-white/75 text-lg mb-8 leading-relaxed">
              Our child-centered approach focuses on developmental milestones, early intervention, and creating joyful therapy experiences that make a lasting impact.
            </p>
            <div className="flex flex-wrap gap-3 mb-10">
              {['Cerebral Palsy', 'Autism Spectrum', 'Developmental Delays', 'Down Syndrome'].map((tag) => (
                <span key={tag} className="bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm px-4 py-2 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <Button variant="white" to="/services/pediatric-rehabilitation" icon={ArrowRight}>
              Learn About Pediatric Care
            </Button>
          </motion.div>
        </div>
      </section>


      {/* ─── 6. WHY CHOOSE US ─── */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHeader
              title="Why Choose AArambh"
              subtitle="What sets us apart in the field of rehabilitation care."
            />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {[
              { icon: ShieldCheck, title: 'Certified Therapists', desc: 'Highly qualified professionals with specialized training and certifications.', gradient: 'from-primary to-blue-500' },
              { icon: Heart, title: 'Patient-Centered', desc: 'Treatments designed around your specific lifestyle, goals and comfort.', gradient: 'from-rose-500 to-pink-500' },
              { icon: Building2, title: 'Institutional Expertise', desc: 'Trusted by leading hospitals and clinics for B2B partnerships.', gradient: 'from-teal to-emerald-500' },
              { icon: Star, title: 'Holistic Recovery', desc: 'Focusing on physical, emotional, and psychological wellbeing.', gradient: 'from-amber-500 to-orange-500' },
            ].map((item, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-8 text-center border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group"
              >
                <div className={`w-16 h-16 mx-auto bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon size={28} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ─── 7. JOURNEY TIMELINE ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHeader
              title="Your Journey to Recovery"
              subtitle="Our structured 5-step process ensures you receive the best possible care from start to finish."
            />
          </motion.div>
          <div className="relative max-w-5xl mx-auto">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-8 left-[10%] right-[10%] h-px bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 z-0" />

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 lg:grid-cols-5 gap-8 relative z-10"
            >
              {[
                { step: '01', title: 'Initial Assessment', icon: Stethoscope },
                { step: '02', title: 'Personalized Plan', icon: CheckCircle },
                { step: '03', title: 'Therapy Sessions', icon: Activity },
                { step: '04', title: 'Progress Monitoring', icon: Award },
                { step: '05', title: 'Family Guidance', icon: Heart }
              ].map((item, index) => (
                <motion.div key={index} variants={fadeUp} custom={index} className="text-center group">
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-primary/20 group-hover:shadow-primary/40 group-hover:scale-110 transition-all duration-300">
                      <item.icon size={24} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-teal text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold">{item.title}</h3>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>


      {/* ─── 8. PARTNERSHIPS ─── */}
      <section className="py-24 bg-gradient-to-br from-[#0A2540] via-primary to-[#0A2540] text-white relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <span className="inline-block text-teal text-sm font-semibold uppercase tracking-widest mb-4">B2B Partnerships</span>
            <h2 className="text-white text-[clamp(28px,4vw,44px)] mb-6 font-bold">Partner With Us</h2>
            <p className="text-white/70 max-w-2xl mx-auto mb-12 text-lg leading-relaxed">
              We collaborate with hospitals, clinics, and care centers to elevate their rehabilitation services.
              From providing trained therapists to managing full-scale rehab operations.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="flex flex-wrap justify-center gap-4 mb-12"
          >
            {['City Hospital', 'Medicare Clinic', 'ElderCare Homes', 'HealthFirst Center'].map((name, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="bg-white/10 backdrop-blur-sm border border-white/10 px-8 py-4 rounded-2xl flex items-center gap-3 hover:bg-white/15 transition-colors"
              >
                <Building2 size={20} className="text-teal" />
                <span className="font-semibold text-[15px]">{name}</span>
              </motion.div>
            ))}
          </motion.div>
          <Button variant="white" to="/partner" icon={ArrowRight}>
            Become a Partner
          </Button>
        </div>
      </section>


      {/* ─── 9. TESTIMONIALS ─── */}
      <section className="py-24 bg-bg">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHeader
              title="Patient Success Stories"
              subtitle="Hear from the individuals whose lives have been transformed through our care."
            />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={testimonial.id}
                variants={fadeUp}
                custom={i}
                className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Quote mark */}
                <div className="text-teal/20 text-5xl font-serif leading-none mb-2">"</div>
                <p className="text-text-muted italic mb-6 leading-relaxed">{testimonial.quote}</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-teal rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-text-dark text-[15px]">{testimonial.name}</h4>
                    <p className="text-xs text-teal font-medium">{testimonial.condition}</p>
                  </div>
                  <div className="ml-auto flex text-teal gap-0.5">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} size={12} className="fill-teal" />
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ─── 10. FAQ ─── */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <SectionHeader
              title="Frequently Asked Questions"
              subtitle="Find answers to common questions about our rehabilitation services."
            />
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <Accordion items={faqs} />
          </motion.div>
        </div>
      </section>


      {/* ─── 11. CTA ─── */}
      <CtaBanner onBookClick={onBookClick} />
    </div>
  );
};

export default Home;
