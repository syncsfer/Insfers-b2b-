'use client';

import { useState, useMemo } from 'react';
import {
  Plus, Search, ShieldCheck, ShieldAlert, Clock, Mail, Trash2, MoreHorizontal,
  Crown, AlertTriangle, Check, RotateCcw, Ban, Users, X,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import { mockTeamMembers } from '@/lib/mock-data';
import { useCollection, newId } from '@/lib/use-collection';
import type { TeamMember, TeamRole, MemberStatus } from '@/types';

/** The signed-in user, so we can prevent self-destructive actions. */
const CURRENT_USER_ID = 'tm_001';

interface RoleSpec {
  id: TeamRole;
  name: string;
  summary: string;
  /** Ordered high to low; used to stop anyone granting above their own level. */
  rank: number;
  can: string[];
  cannot: string[];
  chip: string;
}

export const ROLES: RoleSpec[] = [
  {
    id: 'owner',
    name: 'Owner',
    summary: 'Full control, including billing and settlement wallets.',
    rank: 4,
    can: ['Everything an Admin can do', 'Change settlement wallets', 'Manage billing', 'Transfer ownership', 'Delete the account'],
    cannot: ['Be removed or demoted by anyone else'],
    chip: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    id: 'admin',
    name: 'Admin',
    summary: 'Day-to-day operations and team management.',
    rank: 3,
    can: ['Issue refunds and payouts', 'Send money', 'Manage invoices and catalog', 'Invite and remove members below Admin', 'Configure agents'],
    cannot: ['Change settlement wallets', 'Manage billing', 'Remove the Owner'],
    chip: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    id: 'finance',
    name: 'Finance',
    summary: 'Money movement without account administration.',
    rank: 2,
    can: ['Issue refunds', 'Send money and payouts', 'Create and send invoices', 'Export reports'],
    cannot: ['Manage team members', 'Change settlement wallets', 'Manage API keys'],
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    id: 'developer',
    name: 'Developer',
    summary: 'Integration work without access to funds.',
    rank: 2,
    can: ['Manage API keys and webhooks', 'Use test mode freely', 'Read payments and logs'],
    cannot: ['Move funds or issue refunds', 'Manage team members', 'Change settlement wallets'],
    chip: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    id: 'viewer',
    name: 'Viewer',
    summary: 'Read-only. Good for accountants and support staff.',
    rank: 1,
    can: ['View payments, refunds, and invoices', 'Export reports'],
    cannot: ['Move funds', 'Change any setting', 'Manage team members'],
    chip: 'bg-gray-100 text-gray-700 border-gray-200',
  },
];

const roleSpec = (id: TeamRole) => ROLES.find(r => r.id === id) ?? ROLES[4];

/** Roles that can move money — used to size the 2FA warning. */
const MONEY_ROLES: TeamRole[] = ['owner', 'admin', 'finance'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

function inviteTimeLeft(iso: string | null): string | null {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600_000);
  return h >= 24 ? `${Math.floor(h / 24)}d` : `${Math.max(h, 1)}h`;
}

const STATUS_STYLE: Record<MemberStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  invited: 'bg-amber-50 text-amber-700 border-amber-200',
  suspended: 'bg-gray-100 text-gray-600 border-gray-200',
};

export function TeamSection() {
  const { toast } = useToast();
  const { items: members, add, update, remove } = useCollection<TeamMember>('team', mockTeamMembers);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<TeamRole | 'all'>('all');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [removing, setRemoving] = useState<TeamMember | null>(null);
  const [expandedRoles, setExpandedRoles] = useState(false);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<TeamRole>('viewer');

  const currentUser = members.find(m => m.id === CURRENT_USER_ID);
  const myRank = currentUser ? roleSpec(currentUser.role).rank : 0;

  const active = members.filter(m => m.status === 'active');
  const pending = members.filter(m => m.status === 'invited');

  // 2FA coverage among people who can actually move money.
  const moneyMovers = active.filter(m => MONEY_ROLES.includes(m.role));
  const unprotected = moneyMovers.filter(m => !m.two_factor_enabled);
  const coverage = moneyMovers.length
    ? Math.round(((moneyMovers.length - unprotected.length) / moneyMovers.length) * 100)
    : 100;

  const filtered = useMemo(() => {
    let list = members.filter(m => m.status !== 'invited');
    if (roleFilter !== 'all') list = list.filter(m => m.role === roleFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    }
    // Owner first, then by rank, then alphabetically.
    return [...list].sort((a, b) =>
      roleSpec(b.role).rank - roleSpec(a.role).rank || a.name.localeCompare(b.name));
  }, [members, search, roleFilter]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inviteEmail);
  const emailTaken = members.some(m => m.email.toLowerCase() === inviteEmail.toLowerCase());

  /** You cannot act on the Owner, on yourself, or on someone at or above your rank. */
  const canManage = (m: TeamMember) =>
    m.role !== 'owner' && m.id !== CURRENT_USER_ID && roleSpec(m.role).rank < myRank;

  const sendInvite = () => {
    add({
      id: newId('tm'),
      name: inviteName || inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'invited',
      two_factor_enabled: false,
      last_active_at: null,
      invited_by: currentUser?.name ?? null,
      invite_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString(),
      created_at: new Date().toISOString(),
    });
    toast(`Invitation sent to ${inviteEmail}`);
    setInviteOpen(false);
    setInviteEmail(''); setInviteName(''); setInviteRole('viewer');
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Team members</span>
            <Users size={14} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{active.length}</div>
          <div className="mt-1 text-xs text-gray-400">
            {pending.length} invitation{pending.length === 1 ? '' : 's'} pending
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Can move funds</span>
            <Crown size={14} className="text-gray-400" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{moneyMovers.length}</div>
          <div className="mt-1 text-xs text-gray-400">Owner, Admin, and Finance</div>
        </div>

        <div className={`rounded-xl border p-4 ${unprotected.length ? 'border-amber-300 bg-amber-50/60' : 'border-gray-200 bg-white'}`}>
          <div className="mb-2 flex items-center justify-between">
            <span className={`text-xs font-medium ${unprotected.length ? 'text-amber-800' : 'text-gray-500'}`}>
              2FA coverage
            </span>
            {unprotected.length
              ? <ShieldAlert size={14} className="text-amber-600" />
              : <ShieldCheck size={14} className="text-green-600" />}
          </div>
          <div className={`text-2xl font-bold ${unprotected.length ? 'text-amber-900' : 'text-gray-900'}`}>
            {coverage}%
          </div>
          <div className={`mt-1 text-xs ${unprotected.length ? 'text-amber-700' : 'text-gray-400'}`}>
            {unprotected.length
              ? `${unprotected.length} with fund access unprotected`
              : 'Everyone with fund access is protected'}
          </div>
        </div>
      </div>

      {/* 2FA warning — specific about who, not a generic nag */}
      {unprotected.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              {unprotected.length} member{unprotected.length === 1 ? '' : 's'} can move funds without two-factor authentication
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
              {unprotected.map(m => m.name).join(', ')} — a compromised password on{' '}
              {unprotected.length === 1 ? 'this account' : 'any of these accounts'} would be enough
              to send payments.
            </p>
            <button
              onClick={() => toast(`Reminder sent to ${unprotected.length} member${unprotected.length === 1 ? '' : 's'}`)}
              className="mt-2 text-[13px] font-medium text-amber-900 underline underline-offset-2"
            >
              Ask them to enable it
            </button>
          </div>
        </div>
      )}

      {/* Members */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Members</h2>
            <p className="mt-0.5 text-[13px] text-gray-500">Who can access this account, and what they can do.</p>
          </div>
          <button
            onClick={() => setInviteOpen(true)}
            disabled={myRank < 3}
            title={myRank < 3 ? 'Only Admins and Owners can invite' : undefined}
            className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Plus size={15} /> Invite
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-3">
          <div className="relative max-w-xs flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or email"
              className="w-full rounded-lg border border-gray-200 py-2 pl-8 pr-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value as TeamRole | 'all')}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All roles</option>
            {ROLES.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>

        <ul className="divide-y divide-gray-100">
          {filtered.length === 0 && (
            <li className="px-5 py-10 text-center text-sm text-gray-400">No members match your filters</li>
          )}
          {filtered.map(m => {
            const spec = roleSpec(m.role);
            const isYou = m.id === CURRENT_USER_ID;
            const manageable = canManage(m);

            return (
              <li key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  m.status === 'suspended' ? 'bg-gray-100 text-gray-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  {initials(m.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${m.status === 'suspended' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {m.name}
                    </span>
                    {isYou && (
                      <span className="rounded border border-gray-200 bg-gray-50 px-1 py-px text-[9px] font-semibold uppercase text-gray-500">
                        You
                      </span>
                    )}
                    {m.role === 'owner' && <Crown size={12} className="text-purple-500" />}
                    {m.status !== 'active' && (
                      <span className={`rounded-full border px-1.5 py-px text-[10px] font-semibold capitalize ${STATUS_STYLE[m.status]}`}>
                        {m.status}
                      </span>
                    )}
                  </div>
                  <div className="truncate text-[12px] text-gray-500">{m.email}</div>
                </div>

                {/* 2FA */}
                <div className="hidden w-24 shrink-0 sm:block">
                  {m.two_factor_enabled ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-600">
                      <ShieldCheck size={12} /> 2FA on
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                        MONEY_ROLES.includes(m.role) ? 'text-amber-600' : 'text-gray-400'
                      }`}
                      title={MONEY_ROLES.includes(m.role) ? 'This member can move funds without 2FA' : undefined}
                    >
                      <ShieldAlert size={12} /> No 2FA
                    </span>
                  )}
                </div>

                {/* Last active */}
                <div className="hidden w-28 shrink-0 text-[11px] text-gray-400 md:block">
                  {m.last_active_at ? formatRelativeTime(m.last_active_at) : 'Never signed in'}
                </div>

                {/* Role */}
                <div className="w-32 shrink-0">
                  {manageable ? (
                    <select
                      value={m.role}
                      onChange={e => {
                        const next = e.target.value as TeamRole;
                        update(m.id, { role: next });
                        toast(`${m.name} is now ${roleSpec(next).name}`);
                      }}
                      className={`w-full rounded-full border px-2 py-1 text-[11px] font-semibold ${spec.chip} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    >
                      {/* Never offer a role at or above your own. */}
                      {ROLES.filter(r => r.rank < myRank).map(r => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  ) : (
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${spec.chip}`}>
                      {spec.name}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex w-20 shrink-0 justify-end gap-1">
                  {manageable && m.status === 'active' && (
                    <button
                      onClick={() => { update(m.id, { status: 'suspended' }); toast(`${m.name} suspended`); }}
                      title="Suspend access"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <Ban size={14} />
                    </button>
                  )}
                  {manageable && m.status === 'suspended' && (
                    <button
                      onClick={() => { update(m.id, { status: 'active' }); toast(`${m.name} reinstated`); }}
                      title="Restore access"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-green-600"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                  {manageable && (
                    <button
                      onClick={() => setRemoving(m)}
                      title="Remove from team"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  {!manageable && (
                    <span
                      className="p-1.5 text-gray-200"
                      title={m.role === 'owner' ? 'The Owner cannot be modified' : isYou ? 'You cannot change your own access' : 'Requires a higher role'}
                    >
                      <MoreHorizontal size={14} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pending invitations */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="text-base font-semibold text-gray-900">Pending invitations</h2>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Invitations expire after 72 hours if not accepted.
            </p>
          </div>
          <ul className="divide-y divide-gray-100">
            {pending.map(m => {
              const left = inviteTimeLeft(m.invite_expires_at);
              const urgent = left?.endsWith('h');
              return (
                <li key={m.id} className="flex items-center gap-4 px-5 py-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                    <Mail size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{m.email}</div>
                    <div className="text-[12px] text-gray-500">
                      Invited by {m.invited_by ?? 'someone'} · {formatDate(m.created_at).split(',')[0]}
                    </div>
                  </div>
                  <span className={`inline-block shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${roleSpec(m.role).chip}`}>
                    {roleSpec(m.role).name}
                  </span>
                  <span className={`hidden w-24 shrink-0 items-center gap-1 text-[11px] font-medium sm:inline-flex ${
                    left ? (urgent ? 'text-orange-600' : 'text-gray-500') : 'text-red-500'
                  }`}>
                    <Clock size={11} /> {left ? `${left} left` : 'Expired'}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        update(m.id, { invite_expires_at: new Date(Date.now() + 72 * 3600_000).toISOString() });
                        toast(`Invitation resent to ${m.email}`);
                      }}
                      title="Resend invitation"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button
                      onClick={() => { remove(m.id); toast('Invitation revoked'); }}
                      title="Revoke invitation"
                      className="rounded-md p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Role reference */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <button
          onClick={() => setExpandedRoles(!expandedRoles)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div>
            <h2 className="text-base font-semibold text-gray-900">What each role can do</h2>
            <p className="mt-0.5 text-[13px] text-gray-500">
              Permissions are fixed. Grant the least access that lets someone do their job.
            </p>
          </div>
          <span className="text-[13px] font-medium text-blue-600">
            {expandedRoles ? 'Hide' : 'Show'}
          </span>
        </button>

        {expandedRoles && (
          <div className="grid gap-px border-t border-gray-100 bg-gray-100 sm:grid-cols-2">
            {ROLES.map(r => (
              <div key={r.id} className="bg-white p-5">
                <div className="flex items-center gap-2">
                  <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-semibold ${r.chip}`}>
                    {r.name}
                  </span>
                  <span className="text-[12px] text-gray-400">
                    {members.filter(m => m.role === r.id && m.status === 'active').length} member(s)
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-gray-600">{r.summary}</p>

                <ul className="mt-3 space-y-1.5">
                  {r.can.map(c => (
                    <li key={c} className="flex gap-2 text-[12.5px] text-gray-700">
                      <Check size={13} className="mt-0.5 shrink-0 text-green-600" />
                      {c}
                    </li>
                  ))}
                  {r.cannot.map(c => (
                    <li key={c} className="flex gap-2 text-[12.5px] text-gray-400">
                      <X size={13} className="mt-0.5 shrink-0 text-gray-300" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        size="lg"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setInviteOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={sendInvite}
              disabled={!emailValid || emailTaken}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Mail size={14} /> Send invitation
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
                placeholder="colleague@acme.com"
                autoFocus
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
              {emailTaken && (
                <p className="mt-1.5 text-[12px] text-red-500">This person is already on your team</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] font-medium text-gray-700">
                Name <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                value={inviteName}
                onChange={e => setInviteName(e.target.value)}
                placeholder="Jordan Lee"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-[13px] font-medium text-gray-700">Role</label>
            <div className="space-y-2">
              {ROLES.filter(r => r.rank < myRank).map(r => (
                <button
                  key={r.id}
                  onClick={() => setInviteRole(r.id)}
                  className={`flex w-full items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-all ${
                    inviteRole === r.id
                      ? 'border-blue-500 bg-blue-50/60 ring-4 ring-blue-500/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className={`mt-0.5 inline-block shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${r.chip}`}>
                    {r.name}
                  </span>
                  <span className="flex-1 text-[13px] leading-relaxed text-gray-600">{r.summary}</span>
                  {inviteRole === r.id && <Check size={15} className="mt-0.5 shrink-0 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>

          {/* What they'll be able to do — shown before you commit */}
          {MONEY_ROLES.includes(inviteRole) && (
            <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-600" />
              <p className="text-[13px] leading-relaxed text-amber-900">
                A {roleSpec(inviteRole).name} can move real funds out of your account. Invite only
                people you trust with that, and ask them to enable two-factor authentication as
                soon as they join.
              </p>
            </div>
          )}
        </div>
      </Modal>

      {/* Remove confirmation */}
      <Modal
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="Remove team member"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setRemoving(null)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (removing) {
                  remove(removing.id);
                  toast(`${removing.name} removed from the team`);
                }
                setRemoving(null);
              }}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        }
      >
        {removing && (
          <div>
            <p className="text-sm leading-relaxed text-gray-700">
              <span className="font-semibold text-gray-900">{removing.name}</span> ({removing.email})
              will immediately lose access to this account, including any active sessions.
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-gray-500">
              Records of what they did — payments, refunds, and invoices — are kept for your audit
              trail and are not deleted.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
