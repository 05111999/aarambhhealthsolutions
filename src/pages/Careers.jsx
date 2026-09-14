import React, { useState } from 'react';
import { MapPin, Briefcase, GraduationCap, HeartPulse, Send, CheckCircle } from 'lucide-react';
import SectionHeader from '../components/common/SectionHeader';
import { jobs } from '../data/mockData';
import Button from '../components/common/Button';

const Careers = () => {
  const [selectedJob, setSelectedJob] = useState('');

  return (
    <div className="w-full">
      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-light-blue text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-white mb-6">Join Our Team</h1>
          <p className="text-white/90 text-lg max-w-2xl mx-auto">
            Build a rewarding career at AArambh. We are always looking for passionate, ethical, and skilled professionals to join our mission of transforming rehabilitation care.
          </p>
        </div>
      </section>

      {/* Why Work With Us */}
      <section className="py-20 bg-bg border-b border-border">
        <div className="container mx-auto px-4">
          <SectionHeader 
            title="Why Work With AArambh" 
            subtitle="We invest in our people so they can invest in our patients."
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm text-center">
              <GraduationCap className="mx-auto text-teal mb-4" size={40} />
              <h3 className="text-lg mb-2">Continuous Learning</h3>
              <p className="text-text-muted text-sm">Regular training sessions, workshops, and support for advanced certifications.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm text-center">
              <Briefcase className="mx-auto text-teal mb-4" size={40} />
              <h3 className="text-lg mb-2">Career Growth</h3>
              <p className="text-text-muted text-sm">Clear pathways from junior roles to specialized clinical leads and management.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm text-center">
              <HeartPulse className="mx-auto text-teal mb-4" size={40} />
              <h3 className="text-lg mb-2">Compassionate Culture</h3>
              <p className="text-text-muted text-sm">A supportive environment where empathy and ethical practice are celebrated.</p>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm text-center">
              <CheckCircle className="mx-auto text-teal mb-4" size={40} />
              <h3 className="text-lg mb-2">Work-Life Balance</h3>
              <p className="text-text-muted text-sm">Flexible scheduling options and reasonable caseloads to prevent burnout.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Openings & Application */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row gap-12">
          
          {/* Jobs List */}
          <div className="lg:w-1/2">
            <h2 className="mb-8">Current Openings</h2>
            <div className="space-y-6">
              {jobs.map((job) => (
                <div key={job.id} className="bg-bg border border-border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl text-primary font-bold">{job.title}</h3>
                    <span className="bg-teal/10 text-teal text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                      {job.type}
                    </span>
                  </div>
                  <div className="flex items-center text-text-muted text-sm mb-4">
                    <MapPin size={16} className="mr-1" /> {job.location}
                  </div>
                  <p className="text-text-muted mb-4 text-sm">{job.description}</p>
                  <button 
                    onClick={() => {
                      setSelectedJob(job.title);
                      document.getElementById('application-form').scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-teal font-semibold text-sm hover:text-primary transition-colors flex items-center"
                  >
                    Apply for this role &rarr;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Application Form */}
          <div className="lg:w-1/2" id="application-form">
            <div className="bg-bg p-8 rounded-2xl border border-border sticky top-24 shadow-sm">
              <h2 className="text-2xl mb-6">Submit Your Application</h2>
              <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Full Name *</label>
                  <input type="text" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Email *</label>
                    <input type="email" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text-dark mb-1">Phone *</label>
                    <input type="tel" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Role Applying For *</label>
                  <select 
                    className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none bg-white"
                    value={selectedJob}
                    onChange={(e) => setSelectedJob(e.target.value)}
                    required
                  >
                    <option value="">Select a role</option>
                    {jobs.map(j => <option key={j.id} value={j.title}>{j.title}</option>)}
                    <option value="General Application">General Application</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Years of Experience</label>
                  <input type="number" min="0" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Upload Resume/CV *</label>
                  <input type="file" accept=".pdf,.doc,.docx" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none bg-white text-sm" required />
                  <p className="text-xs text-text-muted mt-1">PDF, DOC, or DOCX (Max 5MB)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Cover Note</label>
                  <textarea rows="3" className="w-full px-4 py-2 border border-border rounded-md focus:ring-2 focus:ring-primary/20 outline-none resize-none" placeholder="Briefly tell us why you're a good fit..."></textarea>
                </div>

                <Button type="submit" className="w-full" icon={Send}>Submit Application</Button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Careers;
