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
    Mail,
    Phone,
    Calendar,
    Power,
    MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { User, UserRole, StatusState } from '../types';

export default function AdminDashboard() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [status, setStatus] = useState<StatusState>({ message: '', type: '' });
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>(UserRole.USER);
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update-role`, {
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
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update-status`, {
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

    const handleDeleteUser = async (userId: string) => {
        if (currentUserRole !== UserRole.ROOT_ADMIN) {
            showStatus('Only Root Admin can delete users', 'error');
            return;
        }

        if (!window.confirm('Are you sure you want to delete this user?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                showStatus('User deleted successfully', 'success');
                fetchUsers();
            } else {
                showStatus(data.message || 'Failed to delete user', 'error');
            }
        } catch (err) {
            showStatus('Error deleting user', 'error');
        }
    };

    const handleResetPassword = async (userId: string) => {
        const newPassword = window.prompt('Enter new password for this user:');
        if (!newPassword) return;

        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/update-pwd-admin`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, newPassword })
            });
            const data = await response.json();
            if (data.success) {
                showStatus('Password reset successfully', 'success');
            } else {
                showStatus(data.message || 'Failed to reset password', 'error');
            }
        } catch (err) {
            showStatus('Error resetting password', 'error');
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
            case UserRole.ROOT_ADMIN: return 'bg-rose-100 text-rose-700 border-rose-200';
            case UserRole.ADMIN: return 'bg-amber-100 text-amber-700 border-amber-200';
            case UserRole.STAFF: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
            <div className="max-w-[1200px] mx-auto p-6 md:p-8 lg:p-12">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button 
                            onClick={() => navigate('/dashboard')}
                            className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                        >
                            <ArrowLeft size={20} className="text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight uppercase">
                                System Administration
                            </h1>
                            <p className="text-slate-500 text-xs font-bold flex items-center gap-2 mt-1 uppercase tracking-wider">
                                <ShieldCheck size={12} className="text-emerald-600" /> User Management & Access Control
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {status.message && (
                            <div className={`px-4 py-2.5 rounded-xl flex items-center gap-2 border text-[11px] font-bold uppercase tracking-wider shadow-sm animate-in fade-in slide-in-from-top-2 ${
                                status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}>
                                {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                                <span>{status.message}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-900/20">
                            <Shield size={14} className="text-emerald-400" />
                            {getRoleName(currentUserRole)}
                        </div>
                    </div>
                </header>

                {/* Dashboard Stats / Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 border border-indigo-100">
                            <Users size={24} />
                        </div>
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Total Users</h3>
                        <p className="text-3xl font-bold text-slate-900">{users.length}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4 border border-emerald-100">
                            <Shield size={24} />
                        </div>
                        <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Active Admins</h3>
                        <p className="text-3xl font-bold text-slate-900">
                            {users.filter(u => u.role === UserRole.ROOT_ADMIN || u.role === UserRole.ADMIN).length}
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                        <div>
                            <h3 className="text-slate-900 text-sm font-bold uppercase tracking-tight mb-1">Administrative Actions</h3>
                            <p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Manage system permissions</p>
                        </div>
                        <button 
                            onClick={() => showStatus('User registration via admin coming soon', 'success')}
                            className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/10"
                        >
                            <UserPlus size={14} /> Add New Member
                        </button>
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight flex items-center gap-3">
                            <Users size={20} className="text-slate-400" />
                            Registered Members
                        </h2>
                        <button 
                            onClick={fetchUsers}
                            className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
                            title="Refresh List"
                        >
                            <Loader2 size={18} className={isLoading ? 'animate-spin' : ''} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                                <tr className="bg-slate-50/50">
                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member Info</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Regional Township</th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Status</th>
                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Management</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {isLoading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-8 py-6"><div className="h-4 bg-slate-100 rounded w-32 mb-2"></div><div className="h-3 bg-slate-50 rounded w-48"></div></td>
                                            <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-24"></div></td>
                                            <td className="px-6 py-6"><div className="h-6 bg-slate-100 rounded-full w-20"></div></td>
                                            <td className="px-6 py-6"><div className="h-4 bg-slate-100 rounded w-16"></div></td>
                                            <td className="px-8 py-6"><div className="h-10 bg-slate-100 rounded-xl w-full"></div></td>
                                        </tr>
                                    ))
                                ) : users.map((user) => (
                                    <tr key={user._id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black border border-slate-800 uppercase">
                                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover rounded-xl" alt="" /> : user.name.substring(0, 2)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-bold text-slate-900 uppercase tracking-tight">{user.name}</div>
                                                    <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                                                        <Calendar size={10} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-unicodes">
                                            <div className="text-[11px] font-bold text-slate-600 flex flex-col gap-1">
                                                <span className="flex items-center gap-2"><Mail size={12} className="text-slate-300" /> {user.email}</span>
                                                {user.phone && <span className="flex items-center gap-2"><Phone size={12} className="text-slate-300" /> {user.phone}</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col gap-2">
                                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border uppercase tracking-wider inline-flex items-center justify-center w-fit ${getRoleBadgeColor(user.role)}`}>
                                                    {getRoleName(user.role)}
                                                </span>
                                                {currentUserRole === UserRole.ROOT_ADMIN && (
                                                    <select 
                                                        className="text-[9px] font-bold bg-white border border-slate-200 rounded-lg p-1 outline-none hover:border-slate-400 transition-all uppercase tracking-tighter"
                                                        value={user.role}
                                                        onChange={(e) => handleUpdateRole(user._id, parseInt(e.target.value))}
                                                    >
                                                        <option value={UserRole.USER}>Set USER</option>
                                                        <option value={UserRole.STAFF}>Set STAFF</option>
                                                        <option value={UserRole.ADMIN}>Set ADMIN</option>
                                                        <option value={UserRole.ROOT_ADMIN}>Set ROOT ADMIN</option>
                                                    </select>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <MapPin className="text-slate-300" size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                                                    {user.township || 'NOT DEFINED'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-center">
                                            <button 
                                                onClick={() => handleToggleStatus(user._id, user.active)}
                                                className="flex items-center gap-2 hover:bg-slate-100 p-2 rounded-lg transition-all"
                                                title={user.active ? 'Click to Deactivate' : 'Click to Activate'}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${user.active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-300'}`}></div>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${user.active ? 'text-emerald-700' : 'text-rose-400'}`}>
                                                    {user.active ? 'DATABASE LIVE' : 'STATIONED'}
                                                </span>
                                            </button>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => handleResetPassword(user._id)}
                                                    className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-amber-600 hover:border-amber-200 hover:bg-amber-50 transition-all shadow-sm active:scale-95"
                                                    title="Reset Password"
                                                >
                                                    <Key size={16} />
                                                </button>
                                                {currentUserRole === UserRole.ROOT_ADMIN && (
                                                    <button 
                                                        onClick={() => handleDeleteUser(user._id)}
                                                        className="p-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-all shadow-sm active:scale-95"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {users.length === 0 && !isLoading && (
                            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                                <Users size={48} className="mb-4 opacity-20" />
                                <p className="text-xs font-bold uppercase tracking-[0.2em]">No Users Found in System</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
