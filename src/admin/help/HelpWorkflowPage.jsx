import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Route } from 'lucide-react';
import { useHelp } from './useHelp';
import { HelpBreadcrumb, StillNeedHelp, WorkflowTimeline } from './HelpUI';

// /admin/help/workflow/:workflowId — a complete process as a timeline.
const HelpWorkflowPage = () => {
  const { workflowId } = useParams();
  const help = useHelp();
  const workflow = help.workflows.find((w) => w.id === workflowId);

  if (!workflow) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">This workflow isn’t part of your role.</p>
        <Link to="/admin/help" className="text-primary font-semibold">Back to Help Center</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link to="/admin/help" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-3 transition-colors">
        <ArrowLeft size={16} />
        Back to Help Center
      </Link>
      <HelpBreadcrumb items={[{ label: 'Help Center', to: '/admin/help' }, { label: 'How it works' }, { label: workflow.title }]} />
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-teal/10 text-teal p-2.5 rounded-xl"><Route size={22} /></span>
        <h1 className="mb-0 text-3xl sm:text-4xl">{workflow.title}</h1>
      </div>
      <p className="text-text-muted mb-6">{workflow.description}</p>
      <div className="bg-white rounded-2xl border border-border p-4 sm:p-6 mb-8">
        <WorkflowTimeline workflow={workflow} />
      </div>
      <StillNeedHelp role={help.role} />
    </div>
  );
};

export default HelpWorkflowPage;
