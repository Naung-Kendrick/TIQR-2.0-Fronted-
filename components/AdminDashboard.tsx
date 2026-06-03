import React, { useState, useEffect } from 'react';
import { 
    Users, 
    Shield, 
    Key, 
    Trash2, 
    ArrowLeft, 
    UserPlus, 
    CheckCircle2, 
    AlertCircle,
    Loader2,
    ShieldCheck,
    Gauge,
    Mail,
    Phone,
    Calendar,
    Power,
    MapPin,
    Clock,
    TrendingUp
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, StatusState } from '../types';
import { makeApiUrl } from '../api/config';

function formatSpentTime(lastLoginAt?: string, lastSeen?: string): string {
    if (!lastLoginAt || !lastSeen) return '—';
    const start = new Date(lastLoginAt).getTime();
    const end = new Date(lastSeen).getTime();
    const diffMs = end - start;
    if (diffMs <= 0) return '< 1 min';
    const totalMins = Math.floor(diffMs / 60000);
    if (totalMins < 60) return `${totalMins} min`;
    const hours = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<StatusState>({ message: '', type: '' });
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.USER);
    const [loginLimitModal, setLoginLimitModal] = useState<{ isOpen: boolean; userId: string; currentLimit: number; newLimit: string }>({ isOpen: false, userId: '', currentLimit: 0, newLimit: '' });
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; userId: string }>({ isOpen: false, userId: '' });
    const [passwordModal, setPasswordModal] = useState<{ isOpen: boolean; userId: string; newPassword: string }>({ isOpen: false, userId: '', newPassword: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('auth_role');
        if (role) {
            const roleNum = parseInt(role);
            setCurrentUserRole(roleNum);
            if (roleNum !== UserRole.ROOT_ADMIN && roleNum !== UserRole.ADMIN) {
                navigate('/dashboard');
            }
        } else {
            navigate('/');
        }
        fetchUsers();
    }, [navigate]);

    const showStatus = (message: string, type: 'success' | 'error') => {
        setStatus({ message, type });
        setTimeout(() => setStatus({ message: '', type: '' }), 3000);
    };

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(makeApiUrl('/api/users'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            } else {
                showStatus(data.message || 'Failed to fetch users', 'error');
            }
        } catch (err) {
            showStatus('Network error while fetching users', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateRole = async (userId: string, newRole: UserRole) => {
        if (currentUserRole !== UserRole.ROOT_ADMIN) {
            showStatus('Only Root Admin can change roles', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(makeApiUrl('/api/users/update-role'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, role: newRole })
            });
            const data = await response.json();
            if (data.success) {
                showStatus('User role updated successfully', 'success');
                fetchUsers();
            } else {
                showStatus(data.message || 'Failed to update role', 'error');
            }
        } catch (err) {
            showStatus('Error updating role', 'error');
        }
    };

    const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(makeApiUrl('/api/users/update-status'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, active: !currentStatus })
            });
            const data = await response.json();
            if (data.success) {
                showStatus(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
                fetchUsers();
            } else {
                showStatus(data.message || 'Failed to update status', 'error');
            }
        } catch (err) {
            showStatus('Error updating status', 'error');
        }
    };

    const handleOpenDeleteModal = (userId: string) => {
        if (currentUserRole !== UserRole.ROOT_ADMIN) {
            showStatus('Only Root Admin can delete users', 'error');
            return;
        }
        setDeleteModal({ isOpen: true, userId });
    };

    const handleCloseDeleteModal = () => {
        setDeleteModal({ isOpen: false, userId: '' });
    };

    const handleConfirmDelete = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(makeApiUrl(`/api/users/${deleteModal.userId}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                showStatus('User deleted successfully', 'success');
                handleCloseDeleteModal();
                fetchUsers();
            } else {
                showStatus(data.message || 'Failed to delete user', 'error');
            }
        } catch (err) {
            showStatus('Error deleting user', 'error');
        }
    };

    const handleOpenPasswordModal = (userId: string) => {
        setPasswordModal({ isOpen: true, userId, newPassword: '' });
    };

    const handleClosePasswordModal = () => {
        setPasswordModal({ isOpen: false, userId: '', newPassword: '' });
    };

    const handleSavePassword = async () => {
        if (!passwordModal.newPassword || passwordModal.newPassword.length < 6) {
            showStatus('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(makeApiUrl('/api/users/update-pwd-admin'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: passwordModal.userId, newPassword: passwordModal.newPassword })
            });
            const data = await response.json();
            if (data.success) {
                showStatus('Password reset successfully', 'success');
                handleClosePasswordModal();
            } else {
                showStatus(data.message || 'Failed to reset password', 'error');
            }
        } catch (err) {
            showStatus('Error resetting password', 'error');
        }
    };

    const handleOpenLoginLimitModal = (userId: string, currentLimit: number | undefined) => {
        setLoginLimitModal({
            isOpen: true,
            userId,
            currentLimit: currentLimit || 0,
            newLimit: (currentLimit || 0).toString()
        });
    };

    const handleCloseLoginLimitModal = () => {
        setLoginLimitModal({ isOpen: false, userId: '', currentLimit: 0, newLimit: '' });
    };

    const handleSaveLoginLimit = async () => {
        const newLimit = parseInt(loginLimitModal.newLimit);
        if (isNaN(newLimit) || newLimit < 0) {
            showStatus('Please enter a valid number (0 or greater)', 'error');
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(makeApiUrl('/api/users/update-login-limit'), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId: loginLimitModal.userId, dailyLoginLimit: newLimit })
            });
            const data = await response.json();
            if (data.success) {
                showStatus(`Login limit updated to ${newLimit === 0 ? 'unlimited' : newLimit + ' per day'}`, 'success');
                handleCloseLoginLimitModal();
                fetchUsers();
            } else {
                showStatus(data.message || 'Failed to update login limit', 'error');
            }
        } catch (err) {
            showStatus('Error updating login limit', 'error');
        }
    };

    const getRoleName = (role: UserRole) => {
        switch (role) {
            case UserRole.ROOT_ADMIN: return 'ROOT ADMIN';
            case UserRole.ADMIN: return 'ADMIN';
            case UserRole.STAFF: return 'STAFF';
            case UserRole.USER: return 'USER';
            default: return 'UNKNOWN';
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case UserRole.ROOT_ADMIN: return 'bg-red-500/20 text-red-400 border-red-500/30';
            case UserRole.ADMIN: return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case UserRole.STAFF: return 'bg-white/15 text-white/70 border-white/20';
            default: return 'bg-white/10 text-white/40 border-white/15';
        }
    };

    return (
        <div className="h-screen overflow-hidden text-[#1A1A1A] font-sans selection:bg-black/10 tps-page-enter bg-transparent">
            <div className="h-full overflow-y-auto custom-scrollbar max-w-[1200px] mx-auto px-6 py-5 md:px-8 md:py-6">
                {/* Header */}
                <header className="mb-6 pb-4 border-b border-[#E5E7EB] flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-2 bg-white border border-[#E5E7EB] hover:bg-[#F3F4F6] transition-all active:scale-97"
                        >
                            <ArrowLeft size={16} className="text-[#737373]" />
                        </button>
                        <div>
                            <h1 className="text-base font-bold text-[#1A1A1A] tracking-tight uppercase">
                                System Administration
                            </h1>
                            <p className="text-[#737373] text-[9px] font-bold flex items-center gap-1.5 mt-0.5 uppercase tracking-wider">
                                <ShieldCheck size={10} className="text-[#1A1A1A]" /> User Management & Access Control
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {status.message && (
                            <div className={`px-3 py-1.5 flex items-center gap-2 border text-[11px] font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2 ${
                                status.type === 'success' ? 'bg-[#FAFAFA] text-[#1A1A1A] border-[#E5E7EB]' : 'bg-[#FFF1F2] text-red-600 border-red-500/30'
                            }`}>
                                {status.type === 'success' ? <CheckCircle2 size={14} className="text-green-600" /> : <AlertCircle size={14} className="text-red-500" />}
                                <span>{status.message}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E5E7EB] text-[#1A1A1A] text-[10px] font-black uppercase tracking-widest">
                            <Shield size={12} />
                            {getRoleName(currentUserRole)}
                        </div>
                    </div>
                </header>

                {/* Dashboard Stats / Actions */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-white px-4 py-3 border border-[#E5E7EB] flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 bg-[#FAFAFA] text-[#737373] flex items-center justify-center border border-[#E5E7EB] shrink-0">
                            <Users size={16} />
                        </div>
                        <div>
                            <h3 className="text-[#737373] text-[8px] font-black uppercase tracking-widest">Total Users</h3>
                            <p className="text-xl font-bold text-[#1A1A1A] font-mono">{users.length}</p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-3 border border-[#E5E7EB] flex items-center gap-3 shadow-sm">
                        <div className="w-8 h-8 bg-[#FAFAFA] text-[#737373] flex items-center justify-center border border-[#E5E7EB] shrink-0">
                            <Shield size={16} />
                        </div>
                        <div>
                            <h3 className="text-[#737373] text-[8px] font-black uppercase tracking-widest">Active Admins</h3>
                            <p className="text-xl font-bold text-[#1A1A1A] font-mono">
                                {users.filter(u => u.role === UserRole.ROOT_ADMIN || u.role === UserRole.ADMIN).length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-white px-4 py-3 border border-[#E5E7EB] flex items-center justify-between gap-3 shadow-sm">
                        <div>
                            <h3 className="text-[#1A1A1A] text-[10px] font-bold uppercase tracking-tight">Admin Actions</h3>
                            <p className="text-[#737373] text-[8px] font-medium uppercase tracking-wider">Manage permissions</p>
                        </div>
                        <button 
                            onClick={() => showStatus('User registration via admin coming soon', 'success')}
                            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest hover:bg-black/80 transition-all active:scale-97"
                        >
                            <UserPlus size={12} /> Add Member
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white border border-[#E5E7EB] overflow-hidden shadow-md">
                    <div className="px-5 py-3 border-b border-[#E5E7EB] bg-[#FAFAFA] flex items-center justify-between">
                        <h2 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-tight flex items-center gap-2">
                            <Users size={16} className="text-[#737373]" />
                            Registered Members
                        </h2>
                        <button 
                            onClick={fetchUsers}
                            className="p-1.5 text-[#737373] hover:text-black transition-colors"
                            title="Refresh List"
                        >
                            <Loader2 size={16} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-[#E5E7EB]">
                                <tr className="bg-[#FAFAFA]">
                                    <th className="px-4 py-2 text-left text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Member Info</th>
                                    <th className="px-3 py-2 text-left text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Contact</th>
                                    <th className="px-3 py-2 text-center text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Role / Status</th>
                                    <th className="px-3 py-2 text-center text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Township</th>
                                    <th className="px-3 py-2 text-center text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Started</th>
                                    <th className="px-3 py-2 text-center text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Last Online</th>
                                    <th className="px-3 py-2 text-center text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Spent Time</th>
                                    <th className="px-3 py-2 text-center text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Daily Logins</th>
                                    <th className="px-4 py-2 text-right text-[8px] font-black text-[#737373] uppercase tracking-[0.2em]">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E5E7EB]">
                                {isLoading ? (
                                    [...Array(4)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-4 py-2.5"><div className="h-3 bg-[#FAFAFA] border border-[#E5E7EB] w-28 mb-1"></div><div className="h-2.5 bg-[#FAFAFA]/50 w-20"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-2.5 bg-[#FAFAFA] border border-[#E5E7EB] w-32"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-4 bg-[#FAFAFA] border border-[#E5E7EB] w-16"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-2.5 bg-[#FAFAFA] border border-[#E5E7EB] w-20"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-2.5 bg-[#FAFAFA] border border-[#E5E7EB] w-20"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-2.5 bg-[#FAFAFA] border border-[#E5E7EB] w-20"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-2.5 bg-[#FAFAFA] border border-[#E5E7EB] w-14"></div></td>
                                            <td className="px-3 py-2.5"><div className="h-2.5 bg-[#FAFAFA] border border-[#E5E7EB] w-12"></div></td>
                                            <td className="px-4 py-2.5"><div className="h-6 bg-[#FAFAFA] border border-[#E5E7EB] w-16"></div></td>
                                        </tr>
                                    ))
                                ) : users.map((user) => (
                                    <tr key={user._id} className="hover:bg-[#F3F4F6] transition-colors group">
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 bg-[#FAFAFA] border border-[#E5E7EB] flex items-center justify-center text-[#1A1A1A] text-[8px] font-black uppercase shrink-0">
                                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" alt="" /> : user.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-bold text-[#1A1A1A] uppercase tracking-tight">{user.name}</div>
                                                    <div className="text-[8px] text-[#737373] flex items-center gap-1">
                                                        <Calendar size={8} className="text-[#737373]/50" /> {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="text-[9px] text-[#737373] flex flex-col gap-0.5">
                                                <span className="flex items-center gap-1"><Mail size={9} className="text-[#737373]/40 shrink-0" /> {user.email}</span>
                                                {user.phone && <span className="flex items-center gap-1"><Phone size={9} className="text-[#737373]/40 shrink-0" /> {user.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-col gap-1">
                                                <span className={`px-1.5 py-0.5 text-[7px] font-black border uppercase tracking-wider inline-flex items-center justify-center w-fit ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleName(user.role)}
                                                </span>
                                                <button
                                                    onClick={() => handleToggleStatus(user._id, user.active)}
                                                    className="flex items-center gap-1 transition-all"
                                                    title={user.active ? 'Click to Deactivate' : 'Click to Activate'}
                                                >
                                                    <div className={`w-1.5 h-1.5 shrink-0 ${user.active ? 'bg-black animate-pulse' : 'bg-[#737373]/30'}`}></div>
                                                    <span className={`text-[8px] font-black uppercase tracking-widest ${user.active ? 'text-[#1A1A1A]' : 'text-[#737373]/50'}`}>
                                                        {user.active ? 'LIVE' : 'INACTIVE'}
                                                    </span>
                                                </button>
                                                {currentUserRole === UserRole.ROOT_ADMIN && (
                                                    <select 
                                                        className="text-[8px] font-bold bg-[#FAFAFA] border border-[#E5E7EB] px-1 py-0.5 outline-none hover:border-black transition-all uppercase text-[#1A1A1A] [&>option]:bg-white [&>option]:text-black"
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user._id, parseInt(e.target.value))}
                                                    >
                                                        <option value={UserRole.USER}>USER</option>
                                                        <option value={UserRole.STAFF}>STAFF</option>
                                                        <option value={UserRole.ADMIN}>ADMIN</option>
                                                        <option value={UserRole.ROOT_ADMIN}>ROOT ADMIN</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <span className="text-[8px] font-black uppercase tracking-wider text-[#737373]">
                                                {user.township || '—'}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex flex-col gap-0">
                                                {user.lastLoginAt ? (
                                                    <>
                                                        <span className="text-[8px] font-bold text-[#737373] font-mono">{new Date(user.lastLoginAt).toLocaleDateString()}</span>
                                                        <span className="text-[8px] text-[#737373]/60 font-mono">{new Date(user.lastLoginAt).toLocaleTimeString()}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-[8px] text-[#737373]/30">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex flex-col gap-0">
                                                {user.lastSeen ? (
                                                    <>
                                                        <span className="text-[8px] font-bold text-[#737373] font-mono">{new Date(user.lastSeen).toLocaleDateString()}</span>
                                                        <span className="text-[8px] text-[#737373]/60 font-mono">{new Date(user.lastSeen).toLocaleTimeString()}</span>
                                                    </>
                                                ) : (
                                                    <span className="text-[8px] text-[#737373]/30">—</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <Clock size={9} className="text-[#737373]/40 shrink-0" />
                                                <span className="text-[8px] font-bold text-[#737373] font-mono">
                                                    {formatSpentTime(user.lastLoginAt, user.lastSeen)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <TrendingUp size={9} className="text-[#737373]/40 shrink-0" />
                                                <span className="text-[8px] font-bold text-[#737373] font-mono">
                                                    {user.dailyLoginCount || 0}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2.5">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button 
                                                    onClick={() => handleOpenPasswordModal(user._id)}
                                                    className="p-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[#737373] hover:text-black hover:border-black hover:bg-white transition-all active:scale-97"
                                                    title="Reset Password"
                                                >
                                                    <Key size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleOpenLoginLimitModal(user._id, user.dailyLoginLimit)}
                                                    className="p-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[#737373] hover:text-black hover:border-black hover:bg-white transition-all active:scale-97"
                                                    title={`Login Limit: ${user.dailyLoginLimit === 0 || user.dailyLoginLimit === undefined ? 'Unlimited' : user.dailyLoginLimit + ' per day'}`}
                                                >
                                                    <Gauge size={14} />
                                                </button>
                                                {currentUserRole === UserRole.ROOT_ADMIN && (
                                                    <button 
                                                        onClick={() => handleOpenDeleteModal(user._id)}
                                                        className="p-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[#737373] hover:text-red-600 hover:border-red-500/30 hover:bg-red-50 transition-all active:scale-97"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] border border-[#E5E7EB] shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Trash2 size={18} className="text-red-500" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">
                                Confirm Delete
                            </h3>
                        </div>
                        
                        <p className="text-[9px] text-[#A3A3A3] mb-6 font-mono">
                            Are you sure you want to delete this user? This action cannot be undone.
                        </p>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleCloseDeleteModal}
                                className="flex-1 px-4 py-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[8px] font-black text-[#737373] uppercase tracking-[0.1em] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="flex-1 px-4 py-2 bg-red-600 border border-red-600 text-[8px] font-black text-white uppercase tracking-[0.1em] hover:bg-red-700 transition-all"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Reset Modal */}
            {passwordModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] border border-[#E5E7EB] shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Key size={18} className="text-[#737373]" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">
                                Reset Password
                            </h3>
                        </div>
                        
                        <div className="mb-6">
                            <label className="block text-[8px] font-black text-[#737373] uppercase tracking-[0.1em] mb-2">
                                New Password (min 6 characters)
                            </label>
                            <input
                                type="password"
                                value={passwordModal.newPassword}
                                onChange={(e) => setPasswordModal({ ...passwordModal, newPassword: e.target.value })}
                                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 text-[10px] font-mono text-[#1A1A1A] focus:outline-none focus:border-black"
                                placeholder="Enter new password"
                                minLength={6}
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleClosePasswordModal}
                                className="flex-1 px-4 py-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[8px] font-black text-[#737373] uppercase tracking-[0.1em] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSavePassword}
                                className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#1A1A1A] text-[8px] font-black text-white uppercase tracking-[0.1em] hover:bg-black transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Login Limit Modal */}
            {loginLimitModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-[#1A1A1A] border border-[#E5E7EB] shadow-2xl p-6 w-full max-w-sm mx-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Gauge size={18} className="text-[#737373]" />
                            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.15em]">
                                Set Daily Login Limit
                            </h3>
                        </div>
                        
                        <p className="text-[9px] text-[#A3A3A3] mb-4 font-mono">
                            Current limit: <span className="text-white font-bold">{loginLimitModal.currentLimit === 0 ? 'Unlimited' : loginLimitModal.currentLimit}</span>
                        </p>
                        
                        <div className="mb-6">
                            <label className="block text-[8px] font-black text-[#737373] uppercase tracking-[0.1em] mb-2">
                                Login Limit (0 = Unlimited)
                            </label>
                            <input
                                type="number"
                                value={loginLimitModal.newLimit}
                                onChange={(e) => setLoginLimitModal({ ...loginLimitModal, newLimit: e.target.value })}
                                className="w-full bg-[#FAFAFA] border border-[#E5E7EB] px-3 py-2 text-[10px] font-mono text-[#1A1A1A] focus:outline-none focus:border-black"
                                placeholder="Enter number"
                                min="0"
                            />
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                onClick={handleCloseLoginLimitModal}
                                className="flex-1 px-4 py-2 bg-[#FAFAFA] border border-[#E5E7EB] text-[8px] font-black text-[#737373] uppercase tracking-[0.1em] hover:bg-[#F3F4F6] hover:border-[#D1D5DB] transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveLoginLimit}
                                className="flex-1 px-4 py-2 bg-[#1A1A1A] border border-[#1A1A1A] text-[8px] font-black text-white uppercase tracking-[0.1em] hover:bg-black transition-all"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
