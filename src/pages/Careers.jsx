import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { MapPin, Briefcase, GraduationCap, HeartPulse, Send, CheckCircle, ArrowRight } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import PageHero from '../components/common/PageHero';
import { jobs } from '../data/mockData';
import Button from '../components/common/Button';
import { fadeUp, staggerContainer } from '../lib/motion';
import { db } from '../lib/firebase';

const emptyForm = { name: '', email: '', phone: '', experience: '', coverNote: '' };

const perks = [
  { icon: GraduationCap, title: 'Continuous Learning', desc: 'Regular training sessions, workshops, and support for advanced certifications.' },
  { icon: Briefcase, title: 'Career Growth', desc: 'Clear pathways from junior roles to specialized clinical leads and management.' },
  { icon: HeartPulse, title: 'Compassionate Culture', desc: 'A supportive environment where empathy and ethical practice are celebrated.' },
  { icon: CheckCircle, title: 'Work-Life Balance', desc: 'Flexible scheduling options and reasonable caseloads to prevent burnout.' },
];

const inputClasses = 'w-full px-4 py-2.5 border border-border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'jobApplications'), {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        roleAppliedFor: selectedJob,
        yearsOfExperience: form.experience,
        coverNote: form.coverNote.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      setForm(emptyForm);
      setSelectedJob('');
    } catch (err) {
      setError(err.message || 'Something went wrong submitting your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <PageHero
        eyebrow="We're Hiring"
        title="Join Our Team"
        subtitle="Build a rewarding career at AArambh. We are always looking for passionate, ethical, and skilled professionals to join our mission of transforming rehabilitation care."
      />

      {/* Why Work With Us */}
      <section className="py-24 bg-bg border-b border-border/50">
        <div className="container mx-auto px-4">
          <SectionHeader eyebrow="Life at AArambh" title="Why Work With AArambh" subtitle="We invest in our people so they can invest in our patients." />
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {perks.map((p, i) => (
              <motion.div
                key={p.title}
                variants={fadeUp}
                custom={i}
                className="bg-white p-7 rounded-2xl border border-border/50 shadow-sm text-center hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-14 h-14 mx-auto bg-gradient-to-br from-primary to-teal rounded-2xl flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform duration-300">
                  <p.icon className="text-white" size={26} />
                </div>
                <h3 className="text-lg mb-2">{p.title}</h3>
                <p className="text-text-muted text-sm leading-relaxed">{p.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Job Openings & Application */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-12">
          {/* Jobs List */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={staggerContainer}
            className="lg:w-1/2"
          >
            <h2 className="mb-8">Current Openings</h2>
            <div className="space-y-5">
              {jobs.map((job) => (
                <motion.div
                  key={job.id}
                  variants={fadeUp}
                  className="bg-bg border border-border/50 rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 hover:border-primary/20 transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <h3 className="text-xl text-primary font-bold">{job.title}</h3>
                    <span className="bg-teal/10 text-teal text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shrink-0">
                      {job.type}
                    </span>
                  </div>
                  <div className="flex items-center text-text-muted text-sm mb-4">
                    <MapPin size={16} className="mr-1.5" /> {job.location}
                  </div>
                  <p className="text-text-muted mb-4 text-sm leading-relaxed">{job.description}</p>
                  <button
                    onClick={() => {
                      setSelectedJob(job.title);
                      document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-teal font-semibold text-sm hover:text-primary transition-colors inline-flex items-center gap-1.5 group"
                  >
                    Apply for this role
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Application Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="lg:w-1/2"
            id="application-form"
          >
            <div className="bg-bg p-8 rounded-2xl border border-border/50 sticky top-24">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-primary to-teal text-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal/20">
                    <CheckCircle size={28} />
                  </div>
                  <h3 className="text-2xl font-semibold mb-2">Application Received!</h3>
                  <p className="text-text-muted mb-6">Thank you for applying. Our team will review your application and get in touch.</p>
                  <button onClick={() => setSubmitted(false)} className="text-primary font-semibold text-sm hover:text-teal transition-colors">
                    Submit another application
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl mb-6">Submit Your Application</h2>
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Full Name *</label>
                      <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClasses} required />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Email *</label>
                        <input type="email" name="email" value={form.email} onChange={handleChange} className={inputClasses} required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-dark mb-1">Phone *</label>
                        <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClasses} required />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Role Applying For *</label>
                      <select
                        className={`${inputClasses} bg-white`}
                        value={selectedJob}
                        onChange={(e) => setSelectedJob(e.target.value)}
                        required
                      >
                        <option value="">Select a role</option>
                        {jobs.map((j) => (
                          <option key={j.id} value={j.title}>
                            {j.title}
                          </option>
                        ))}
                        <option value="General Application">General Application</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Years of Experience</label>
                      <input type="number" min="0" name="experience" value={form.experience} onChange={handleChange} className={inputClasses} />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-dark mb-1">Cover Note</label>
                      <textarea
                        name="coverNote"
                        value={form.coverNote}
                        onChange={handleChange}
                        rows="3"
                        className={`${inputClasses} resize-none`}
                        placeholder="Briefly tell us why you're a good fit..."
                      />
                    </div>

                    {error && <p className="text-sm text-red-600">{error}</p>}

                    <Button type="submit" className="w-full" icon={Send} disabled={submitting}>
                      {submitting ? 'Submitting…' : 'Submit Application'}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Careers;
