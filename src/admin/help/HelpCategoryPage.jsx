import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useHelp } from './useHelp';
import { ArticleRow, HelpBreadcrumb, HelpIcon, StillNeedHelp } from './HelpUI';

// /admin/help/category/:categoryId
const HelpCategoryPage = () => {
  const { categoryId } = useParams();
  const help = useHelp();
  const category = help.categories.find((c) => c.id === categoryId);

  if (!category) {
    return (
      <div className="text-center py-16">
        <p className="text-text-muted mb-4">No guides in this topic for your role.</p>
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
      <HelpBreadcrumb items={[{ label: 'Help Center', to: '/admin/help' }, { label: category.title }]} />
      <div className="flex items-center gap-3 mb-2">
        <span className="bg-primary/10 text-primary p-2.5 rounded-xl"><HelpIcon name={category.icon} size={22} /></span>
        <h1 className="mb-0 text-3xl sm:text-4xl">{category.title}</h1>
      </div>
      <p className="text-text-muted mb-6">{category.description}</p>
      <div className="bg-white rounded-2xl border border-border divide-y divide-border overflow-hidden mb-8">
        {category.articles.map((a) => <ArticleRow key={a.id} article={a} />)}
      </div>
      <StillNeedHelp role={help.role} />
    </div>
  );
};

export default HelpCategoryPage;
