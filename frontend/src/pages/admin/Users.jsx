import { useState, useEffect } from 'react';
import { useNotifications } from '../../context';
import { adminAPI } from '../../services';
import { formatDate } from '../../utils';
import { Button, Input, Select, Modal, Table, Badge, EmptyState, LoadingSpinner } from '../../components';
import {
  Users as UsersIcon,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Mail,
  Phone,
  Calendar,
  Shield,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  Download,
} from 'lucide-react';

const Users = () => {
  const { showToast } = useNotifications();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Mock users data
  const mockUsers = [
    { id: 1, name: 'John Smith', email: 'john@example.com', phone: '+1 555-123-4567', role: 'user', status: 'active', createdAt: '2024-08-15', sessions: 45, spent: 325.50 },
    { id: 2, name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+1 555-234-5678', role: 'user', status: 'active', createdAt: '2024-09-20', sessions: 32, spent: 245.00 },
    { id: 3, name: 'Mike Williams', email: 'mike@evcharging.com', phone: '+1 555-345-6789', role: 'operator', status: 'active', createdAt: '2024-07-10', sessions: 0, spent: 0, stations: 5 },
    { id: 4, name: 'Emily Brown', email: 'emily@example.com', phone: '+1 555-456-7890', role: 'user', status: 'suspended', createdAt: '2024-10-05', sessions: 8, spent: 65.00 },
    { id: 5, name: 'David Lee', email: 'david@greencharge.com', phone: '+1 555-567-8901', role: 'operator', status: 'active', createdAt: '2024-06-22', sessions: 0, spent: 0, stations: 12 },
    { id: 6, name: 'Lisa Anderson', email: 'lisa@example.com', phone: '+1 555-678-9012', role: 'user', status: 'active', createdAt: '2024-11-12', sessions: 15, spent: 120.00 },
    { id: 7, name: 'James Wilson', email: 'james@admin.com', phone: '+1 555-789-0123', role: 'admin', status: 'active', createdAt: '2024-01-01', sessions: 0, spent: 0 },
    { id: 8, name: 'Anna Martinez', email: 'anna@example.com', phone: '+1 555-890-1234', role: 'user', status: 'inactive', createdAt: '2024-04-18', sessions: 3, spent: 28.50 },
    { id: 9, name: 'Robert Taylor', email: 'robert@chargepoint.com', phone: '+1 555-901-2345', role: 'operator', status: 'pending', createdAt: '2024-12-01', sessions: 0, spent: 0, stations: 0 },
    { id: 10, name: 'Jennifer Garcia', email: 'jennifer@example.com', phone: '+1 555-012-3456', role: 'user', status: 'active', createdAt: '2024-10-25', sessions: 28, spent: 198.00 },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(mockUsers);
    } catch (error) {
      console.error('Failed to fetch users:', error);
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

  const handleEditUser = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDeleteUser = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setUsers(prev => prev.filter(u => u.id !== selectedUser.id));
      showToast({ type: 'success', message: 'User deleted successfully!' });
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to delete user' });
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: newStatus } : u
      ));
      showToast({ 
        type: 'success', 
        message: `User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully!` 
      });
    } catch (error) {
      showToast({ type: 'error', message: 'Failed to update user status' });
    }
  };

  const handleApproveOperator = async (user) => {
    try {
      setUsers(prev => prev.map(u => 
        u.id === user.id ? { ...u, status: 'active' } : u
      ));
      showToast({ type: 'success', message: 'Operator approved successfully!' });
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
          <button
            onClick={() => handleEditUser(row)}
            className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
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
          <h1 className="text-2xl font-bold text-secondary-900">User Management</h1>
          <p className="text-secondary-500 mt-1">Manage users, operators, and admins</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download}>
            Export
          </Button>
          <Button icon={Plus}>
            Add User
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.total}</p>
              <p className="text-sm text-secondary-500">Total Users</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.active}</p>
              <p className="text-sm text-secondary-500">Active</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.operators}</p>
              <p className="text-sm text-secondary-500">Operators</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.pending}</p>
              <p className="text-sm text-secondary-500">Pending</p>
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

      {/* Edit User Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
        title="Edit User"
        size="md"
      >
        {selectedUser && (
          <div className="space-y-4">
            <Input
              label="Full Name"
              defaultValue={selectedUser.name}
            />
            <Input
              label="Email"
              type="email"
              defaultValue={selectedUser.email}
            />
            <Input
              label="Phone"
              defaultValue={selectedUser.phone}
            />
            <Select label="Role" defaultValue={selectedUser.role}>
              <option value="user">User</option>
              <option value="operator">Operator</option>
              <option value="admin">Admin</option>
            </Select>
            <Select label="Status" defaultValue={selectedUser.status}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
            <div className="flex gap-3 mt-6">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
              >
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  showToast({ type: 'success', message: 'User updated successfully!' });
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Users;
