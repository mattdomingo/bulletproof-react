import { Folder, Users as UsersIcon, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { useDiscussions } from '@/features/discussions/api/get-discussions';
import { useTeams } from '@/features/teams/api/get-teams';
import { useUsers } from '@/features/users/api/get-users';
import { useUser } from '@/lib/auth';

type StatCardProps = {
  label: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
};

const StatCard = ({
  label,
  value,
  description,
  icon,
  color,
  onClick,
}: StatCardProps) => {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-5 text-left text-white transition-opacity hover:opacity-90 ${color} ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{label}</span>
        {icon}
      </div>
      <div className="mt-3 text-3xl font-bold">{value}</div>
      <div className="mt-1 text-sm opacity-80">{description}</div>
    </button>
  );
};

const StatCardLoading = () => (
  <div className="flex h-32 items-center justify-center rounded-xl bg-gray-100">
    <Spinner size="md" />
  </div>
);

const StatCardError = ({ label }: { label: string }) => (
  <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-gray-500">
    <span className="text-sm font-medium">{label}</span>
    <span className="mt-1 text-xs">No data available</span>
  </div>
);

const DashboardRoute = () => {
  const navigate = useNavigate();
  const user = useUser();
  const discussionsQuery = useDiscussions({ page: 1 });
  const usersQuery = useUsers();
  const teamsQuery = useTeams();

  const totalDiscussions = discussionsQuery.data?.meta?.total;
  const totalUsers = usersQuery.data?.data?.length;
  const userTeam = teamsQuery.data?.data?.find(
    (t) => t.id === user.data?.teamId,
  );

  return (
    <ContentLayout title="Dashboard">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discussionsQuery.isLoading ? (
          <StatCardLoading />
        ) : totalDiscussions == null ? (
          <StatCardError label="Total Discussions" />
        ) : (
          <StatCard
            label="Total Discussions"
            value={totalDiscussions}
            description="Click to view all"
            icon={<Folder className="size-6 opacity-80" />}
            color="bg-violet-600"
            onClick={() => navigate(paths.app.discussions.getHref())}
          />
        )}

        {usersQuery.isLoading ? (
          <StatCardLoading />
        ) : totalUsers == null ? (
          <StatCardError label="Total Users" />
        ) : (
          <StatCard
            label="Total Users"
            value={totalUsers}
            description="Registered accounts"
            icon={<UsersIcon className="size-6 opacity-80" />}
            color="bg-emerald-500"
            onClick={() => navigate(paths.app.users.getHref())}
          />
        )}

        {teamsQuery.isLoading ? (
          <StatCardLoading />
        ) : !userTeam ? (
          <StatCardError label="Your Team" />
        ) : (
          <StatCard
            label="Your Team"
            value={userTeam.name}
            description={userTeam.description || 'Team member'}
            icon={<Building2 className="size-6 opacity-80" />}
            color="bg-sky-500"
          />
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900">
          Welcome, {user.data?.firstName} {user.data?.lastName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Role: {user.data?.role}
        </p>
      </div>
    </ContentLayout>
  );
};

export default DashboardRoute;
