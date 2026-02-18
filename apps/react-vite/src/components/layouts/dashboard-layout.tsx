import {
  Home,
  PanelLeft,
  Folder,
  Users,
  User2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Calendar,
  ChevronDown,
  BarChart3,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  NavLink,
  useNavigate,
  useNavigation,
  useSearchParams,
  useLocation,
} from 'react-router';

import logo from '@/assets/logo.svg';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import { paths } from '@/config/paths';
import { useLogout } from '@/lib/auth';
import { ROLES, useAuthorization } from '@/lib/authorization';
import { cn } from '@/utils/cn';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown';
import { Link } from '../ui/link';

export type SideNavigationItem = {
  name: string;
  to: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  section: string;
};

type NavigationSection = {
  label: string;
  items: SideNavigationItem[];
};

const SIDEBAR_COLLAPSED_KEY = 'sidebar-collapsed';

const getInitialCollapsed = (): boolean => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
};

const Logo = ({ collapsed }: { collapsed?: boolean }) => {
  return (
    <Link className="flex items-center text-white" to={paths.home.getHref()}>
      <img className="h-8 w-auto" src={logo} alt="Workflow" />
      {!collapsed && (
        <span className="text-sm font-semibold text-white">
          Bulletproof React
        </span>
      )}
    </Link>
  );
};

const Progress = () => {
  const { state, location } = useNavigation();

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setProgress(0);
  }, [location?.pathname]);

  useEffect(() => {
    if (state === 'loading') {
      const timer = setInterval(() => {
        setProgress((oldProgress) => {
          if (oldProgress === 100) {
            clearInterval(timer);
            return 100;
          }
          const newProgress = oldProgress + 10;
          return newProgress > 100 ? 100 : newProgress;
        });
      }, 300);

      return () => {
        clearInterval(timer);
      };
    }
  }, [state]);

  if (state !== 'loading') {
    return null;
  }

  return (
    <div
      className="fixed left-0 top-0 h-1 bg-blue-500 transition-all duration-200 ease-in-out"
      style={{ width: `${progress}%` }}
    ></div>
  );
};

const useNavigationSections = (): NavigationSection[] => {
  const { checkAccess } = useAuthorization();

  const allItems: (SideNavigationItem | false)[] = [
    {
      name: 'Dashboard',
      to: paths.app.dashboard.getHref(),
      icon: Home,
      section: 'Home',
    },
    {
      name: 'Discussions',
      to: paths.app.discussions.getHref(),
      icon: Folder,
      section: 'Content',
    },
    {
      name: 'Analytics',
      to: paths.app.dashboard.getHref(),
      icon: BarChart3,
      section: 'Content',
    },
    checkAccess({ allowedRoles: [ROLES.ADMIN] }) && {
      name: 'Users',
      to: paths.app.users.getHref(),
      icon: Users,
      section: 'Management',
    },
    {
      name: 'Profile',
      to: paths.app.profile.getHref(),
      icon: Settings,
      section: 'Management',
    },
  ];

  const items = allItems.filter(Boolean) as SideNavigationItem[];

  const sectionOrder = ['Home', 'Content', 'Management'];
  const sectionMap = new Map<string, SideNavigationItem[]>();

  for (const item of items) {
    const existing = sectionMap.get(item.section) || [];
    existing.push(item);
    sectionMap.set(item.section, existing);
  }

  return sectionOrder
    .filter((label) => sectionMap.has(label))
    .map((label) => ({
      label,
      items: sectionMap.get(label)!,
    }));
};

const SidebarNav = ({
  sections,
  collapsed,
}: {
  sections: NavigationSection[];
  collapsed?: boolean;
}) => {
  return (
    <>
      {sections.map((section) => (
        <div key={section.label} className="w-full">
          {!collapsed && (
            <div className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-violet-300">
              {section.label}
            </div>
          )}
          {collapsed && <div className="my-1 border-t border-violet-500/30" />}
          <div className="flex flex-col gap-1">
            {section.items.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                end={item.name !== 'Discussions'}
                className={({ isActive }) =>
                  cn(
                    'text-violet-100 hover:bg-violet-500/30 hover:text-white',
                    'group flex w-full items-center rounded-md p-2 text-sm font-medium',
                    isActive && 'bg-violet-500/40 text-white',
                    collapsed && 'justify-center',
                  )
                }
                title={collapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    'text-violet-200 group-hover:text-white',
                    'size-5 shrink-0',
                    !collapsed && 'mr-3',
                  )}
                  aria-hidden="true"
                />
                {!collapsed && item.name}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const logout = useLogout({
    onSuccess: () => navigate(paths.auth.login.getHref(location.pathname)),
  });
  const [collapsed, setCollapsed] = useState(getInitialCollapsed);
  const sections = useNavigationSections();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const discussionsPath = paths.app.discussions.getHref();
  const isOnDiscussions = location.pathname.startsWith(discussionsPath);

  const filterValue = searchParams.get('filter') || 'all';

  // Local state for the search input to avoid dropped keystrokes.
  // The URL param is updated after a debounce so typing is never interrupted.
  const [localSearch, setLocalSearch] = useState(
    searchParams.get('search') || '',
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = undefined;
      if (isOnDiscussions) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (value) {
              next.set('search', value);
            } else {
              next.delete('search');
            }
            return next;
          },
          { replace: true },
        );
      } else if (value) {
        navigate(`${discussionsPath}?search=${encodeURIComponent(value)}`);
      }
    }, 300);
  };

  // Keep local search in sync when URL changes externally (e.g. back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setLocalSearch((prev) =>
      prev !== urlSearch && !debounceRef.current ? urlSearch : prev,
    );
  }, [searchParams]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  const updateFilterParam = useCallback(
    (value: string) => {
      if (isOnDiscussions) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (value && value !== 'all') {
              next.set('filter', value);
            } else {
              next.delete('filter');
            }
            return next;
          },
          { replace: true },
        );
      } else {
        const params = new URLSearchParams();
        if (value && value !== 'all') {
          params.set('filter', value);
        }
        navigate(
          `${discussionsPath}${params.toString() ? `?${params.toString()}` : ''}`,
        );
      }
    },
    [isOnDiscussions, setSearchParams, navigate, discussionsPath],
  );

  const now = new Date();
  const monthYear = now.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const sidebarWidth = collapsed ? 'w-16' : 'w-60';
  const contentPadding = collapsed ? 'sm:pl-16' : 'sm:pl-60';
  const showActionBar = location.pathname.startsWith('/app');

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-10 hidden flex-col bg-violet-700 transition-all duration-200 sm:flex',
          sidebarWidth,
        )}
      >
        <nav className="flex flex-1 flex-col gap-1 px-2 py-4">
          <div className="flex h-16 shrink-0 items-center px-2">
            <Logo collapsed={collapsed} />
          </div>
          <SidebarNav sections={sections} collapsed={collapsed} />
        </nav>
        <button
          onClick={toggleCollapsed}
          className="flex items-center justify-center border-t border-violet-500/30 p-3 text-violet-200 hover:bg-violet-500/30 hover:text-white"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="size-5" />
          ) : (
            <ChevronLeft className="size-5" />
          )}
        </button>
      </aside>
      <div
        className={cn(
          'flex flex-col transition-all duration-200',
          contentPadding,
        )}
      >
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-white px-4 shadow-sm">
          <Progress />
          <Drawer>
            <DrawerTrigger asChild>
              <Button size="icon" variant="outline" className="sm:hidden">
                <PanelLeft className="size-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </DrawerTrigger>
            <DrawerContent
              side="left"
              className="bg-violet-700 pt-10 text-white sm:max-w-60"
            >
              <nav className="grid gap-2 text-lg font-medium">
                <div className="flex h-16 shrink-0 items-center px-4">
                  <Logo />
                </div>
                <SidebarNav sections={sections} />
              </nav>
            </DrawerContent>
          </Drawer>

          {showActionBar && (
            <>
              <div className="hidden items-center gap-2 text-sm text-gray-600 sm:flex">
                <Calendar className="size-4" />
                <span>{monthYear}</span>
              </div>
              <div className="mx-1 hidden h-6 border-l border-gray-200 sm:block" />
              <div className="relative flex-1 sm:max-w-xs">
                <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pl-8 pr-3 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                  aria-label="Search"
                />
              </div>
              <div className="relative hidden sm:block">
                <select
                  value={filterValue}
                  onChange={(e) => updateFilterParam(e.target.value)}
                  className="h-8 appearance-none rounded-md border border-gray-200 bg-gray-50 pl-3 pr-8 text-sm outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-400"
                  aria-label="Filter discussions"
                >
                  <option value="all">All Discussions</option>
                  <option value="recent">Recent</option>
                  <option value="my">My Discussions</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              </div>
            </>
          )}

          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="overflow-hidden rounded-full"
                >
                  <span className="sr-only">Open user menu</span>
                  <User2 className="size-6 rounded-full" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => navigate(paths.app.profile.getHref())}
                  className={cn('block px-4 py-2 text-sm text-gray-700')}
                >
                  Your Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className={cn(
                    'block px-4 py-2 text-sm text-gray-700 w-full',
                  )}
                  onClick={() => logout.mutate({})}
                >
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-4 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
