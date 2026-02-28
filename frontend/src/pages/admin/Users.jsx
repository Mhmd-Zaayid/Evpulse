import { useState, useEffect } from 'react';
import { useNotifications } from '../../context';
import { adminAPI } from '../../services';
import { formatDate } from '../../utils';
import { Button, Input, Select, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components';
import {
  Users as UsersIcon,
  Search,
  Trash2,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
} from 'lucide-react';

const Users = () => {
  const { showToast } = useNotifications();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllUsers();
      if (response?.success) {
        const mappedUsers = (response.data || []).map((user) => ({
          id: user.id,
          name: user.name || 'Unknown User',
          email: user.email || '',
          phone: user.phone || 'N/A',
          role: user.role || 'user',
          status: user.isActive ? 'active' : 'inactive',
          createdAt: user.joinedDate || null,
          sessions: 0,
          spent: 0,
          stations: Array.isArray(user.stations) ? user.stations.length : 0,
        }));
        setUsers(mappedUsers);
      } else {
        setUsers([]);
        showToast({ type: 'error', message: response?.error || 'Failed to fetch users' });
      }
    } catch (error) {
      setUsers([]);
      showToast({ type: 'error', message: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser?.id) {
      setShowDeleteModal(false);
      setSelectedUser(null);
      return;
    }

    try {
      const response = await adminAPI.deleteUser(selectedUser.id);
      if (response?.success) {
        showToast({ type: 'success', message: response.message || 'User deleted successfully' });
        await fetchUsers();
      } else {
        showToast({ type: 'error', message: response?.error || 'Failed to delete user' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to delete user' });
    } finally {
      setShowDeleteModal(false);
      setSelectedUser(null);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      const response = await adminAPI.updateUserStatus(user.id, newStatus);
      if (response?.success) {
        showToast({ 
          type: 'success', 
          message: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!` 
        });
        await fetchUsers();
      } else {
        showToast({ type: 'error', message: response?.error || 'Failed to update user status' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update user status' });
    }
  };

  const handleApproveOperator = async (user) => {
    try {
      const response = await adminAPI.updateUserStatus(user.id, 'active');
      if (response?.success) {
        showToast({ type: 'success', message: 'Operator approved successfully!' });
        await fetchUsers();
      } else {
        showToast({ type: 'error', message: response?.error || 'Failed to approve operator' });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to approve operator' });
    }
  };

  const getRoleBadge = (role) => {
    const variants = {
      admin: 'danger',
      operator: 'warning',
      user: 'info',
    };
    return <Badge variant={variants[role]}>{role}</Badge>;
  };

  const getStatusBadge = (status) => {
    const variants = {
      active: 'success',
      inactive: 'secondary',
      suspended: 'danger',
      pending: 'warning',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'name',
      label: 'User',
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
            {typeof value === 'string' ? value.split(' ').map(n => n[0]).join('') : '?'}
          </div>
          <div>
            <p className="font-medium text-secondary-900">{value}</p>
            <p className="text-sm text-secondary-500">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      render: (value) => getRoleBadge(value),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (value) => formatDate(value),
    },
    {
      key: 'sessions',
      label: 'Sessions',
      render: (value, row) => row.role === 'user' ? value : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          {row.status === 'pending' && row.role === 'operator' && (
            <button
              onClick={() => handleApproveOperator(row)}
              className="p-2 text-secondary-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Approve"
            >
              <CheckCircle className="w-4 h-4" />
            </button>
          )}
          {row.status !== 'pending' && (
            <button
              onClick={() => handleToggleStatus(row)}
              className={`p-2 rounded-lg transition-colors ${
                row.status === 'active'
                  ? 'text-secondary-500 hover:text-amber-600 hover:bg-amber-50'
                  : 'text-secondary-500 hover:text-green-600 hover:bg-green-50'
              }`}
              title={row.status === 'active' ? 'Suspend' : 'Activate'}
            >
              {row.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={() => handleDeleteUser(row)}
            className="p-2 text-secondary-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    operators: users.filter(u => u.role === 'operator').length,
    pending: users.filter(u => u.status === 'pending').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">User Management</h1>
          <p className="text-secondary-500 mt-1 ml-4">Manage users, operators, and admins</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-sm text-emerald-100/80">Total Users</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.active}</p>
              <p className="text-sm text-emerald-100/80">Active</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.operators}</p>
              <p className="text-sm text-emerald-100/80">Operators</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-sm text-emerald-100/80">Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="operator">Operators</option>
              <option value="admin">Admins</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {paginatedUsers.length > 0 ? (
        <Table
          columns={columns}
          data={paginatedUsers}
          pagination={{
            currentPage,
            totalPages: Math.ceil(filteredUsers.length / itemsPerPage),
            from: (currentPage - 1) * itemsPerPage + 1,
            to: Math.min(currentPage * itemsPerPage, filteredUsers.length),
            total: filteredUsers.length,
            onPageChange: setCurrentPage,
          }}
        />
      ) : (
        <EmptyState
          icon={UsersIcon}
          title="No users found"
          description="Try adjusting your search or filters"
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedUser(null);
        }}
        title="Delete User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-secondary-600">
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => {
                setShowDeleteModal(false);
                setSelectedUser(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleConfirmDelete}
            >
              Delete User
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
