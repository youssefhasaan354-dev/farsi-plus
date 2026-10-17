import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslation } from 'react-i18next';
import { Search, Crown, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  display_name: string | null;
  total_xp: number;
  is_premium: boolean;
  role: string;
  created_at: string;
}

const PAGE_SIZE = 25;

export function AdminUsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('profiles')
      .select('id, email, display_name, total_xp, is_premium, role, created_at', { count: 'exact' });

    if (search.trim()) {
      query = query.or(`email.ilike.%${search.trim()}%,display_name.ilike.%${search.trim()}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (!error && data) {
      setUsers(data as UserProfile[]);
      setTotalCount(count ?? 0);
    }
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
      return;
    }

    setUpdatingId(userId);
    const { error } = await supabase.rpc('admin_set_role', {
      p_user_id: userId,
      p_role: newRole,
    });

    if (!error) {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
    } else {
      alert(`Error updating role: ${error.message}`);
    }
    setUpdatingId(null);
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-white">{t('admin.users.title')}</h1>
        <span className="text-sm text-neutral-500 font-medium">
          {totalCount} {t('admin.users.title')}
        </span>
      </div>

      <div className="relative">
        <Search size={18} className="absolute top-1/2 -translate-y-1/2 left-3 rtl:left-auto rtl:right-3 text-neutral-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          placeholder={t('admin.users.search')}
          className="w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-10 rtl:pl-3 rtl:pr-10 pr-3 py-2.5 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-4 border-primary-500 border-t-transparent rounded-full" />
        </div>
      ) : users.length === 0 ? (
        <div className="py-12 text-center text-muted text-sm">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/60">
              <tr>
                <th className="text-start p-3 font-medium text-neutral-600 dark:text-neutral-400">{t('admin.users.name')}</th>
                <th className="text-start p-3 font-medium text-neutral-600 dark:text-neutral-400">XP</th>
                <th className="text-start p-3 font-medium text-neutral-600 dark:text-neutral-400">{t('admin.users.role')}</th>
                <th className="text-start p-3 font-medium text-neutral-600 dark:text-neutral-400">{t('admin.users.premium')}</th>
                <th className="text-start p-3 font-medium text-neutral-600 dark:text-neutral-400">{t('admin.users.joined')}</th>
                <th className="text-start p-3 font-medium text-neutral-600 dark:text-neutral-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="p-3">
                    <p className="font-medium text-neutral-900 dark:text-white">{u.display_name || '—'}</p>
                    <p className="text-xs text-neutral-500">{u.email}</p>
                  </td>
                  <td className="p-3 font-semibold text-neutral-700 dark:text-neutral-300">{u.total_xp}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${u.role === 'admin' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400'}`}>
                      {u.role === 'admin' && <ShieldCheck size={12} />}
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3">
                    {u.is_premium ? <Crown size={16} className="text-amber-500" /> : '—'}
                  </td>
                  <td className="p-3 text-xs text-neutral-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleRoleChange(u.id, u.role)}
                      disabled={updatingId === u.id}
                      className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50"
                    >
                      {updatingId === u.id ? 'Saving...' : u.role === 'admin' ? 'Make User' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination controls */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 dark:border-neutral-800 text-xs text-muted">
            <span>
              Page {page + 1} of {totalPages}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
