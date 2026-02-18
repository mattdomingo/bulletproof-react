import { ChevronRight } from 'lucide-react';
import * as React from 'react';
import { useLocation } from 'react-router';

import { Link } from '@/components/ui/link';

import { Head } from '../seo';

type ContentLayoutProps = {
  children: React.ReactNode;
  title: string;
};

const Breadcrumbs = ({ title }: { title: string }) => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length <= 1) return null;

  const crumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    // Use the page title for the last segment instead of the raw URL param
    const label = isLast
      ? title
      : segment.charAt(0).toUpperCase() + segment.slice(1);

    return (
      <li key={path} className="flex items-center gap-1.5">
        {index > 0 && (
          <ChevronRight className="size-4 text-gray-400" aria-hidden="true" />
        )}
        {isLast ? (
          <span className="text-sm font-medium text-gray-700">{label}</span>
        ) : (
          <Link
            to={path}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {label}
          </Link>
        )}
      </li>
    );
  });

  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex items-center gap-1.5">{crumbs}</ol>
    </nav>
  );
};

export const ContentLayout = ({ children, title }: ContentLayoutProps) => {
  return (
    <>
      <Head title={title} />
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <Breadcrumbs title={title} />
          <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8">
          {children}
        </div>
      </div>
    </>
  );
};
