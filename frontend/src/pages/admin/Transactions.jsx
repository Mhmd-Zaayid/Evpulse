import { useState, useEffect } from 'react';
import { useNotifications } from '../../context';
import { adminAPI } from '../../services';
import { formatCurrency, formatDate, formatDateTime } from '../../utils';
import { Button, Input, Select, Table, Badge, EmptyState, LoadingSpinner } from '../../components';
import {
  Receipt,
  Search,
  Filter,
  Download,
  DollarSign,
  TrendingUp,
  Calendar,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  RefreshCw,
} from 'lucide-react';

const Transactions = () => {
  const { showToast } = useNotifications();
  
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await adminAPI.getAllTransactions();
      if (response?.success) {
        const mappedTransactions = (response.data || []).map((txn) => ({
          id: txn.id,
          userName: txn.userName || 'Unknown User',
          userId: txn.userId || 'N/A',
          type: txn.type || 'charging',
          amount: Number(txn.amount || 0),
          status: txn.status || 'pending',
          paymentMethod: txn.paymentMethod || 'N/A',
          timestamp: txn.timestamp || null,
          sessionId: txn.sessionId || 'N/A',
        }));
        setTransactions(mappedTransactions);
      } else {
        setTransactions([]);
        showToast({ type: 'error', message: response?.error || 'Failed to fetch transactions' });
      }
    } catch (error) {
      setTransactions([]);
      showToast({ type: 'error', message: 'Failed to fetch transactions' });
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.userId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const createdAt = txn.timestamp ? new Date(txn.timestamp) : null;
    const now = new Date();
    const matchesDate = dateRange === 'all' || !createdAt || (
      dateRange === 'today'
        ? createdAt.toDateString() === now.toDateString()
        : dateRange === 'week'
          ? (now - createdAt) / (1000 * 60 * 60 * 24) <= 7
          : dateRange === 'month'
            ? createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear()
            : true
    );
    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    showToast({ type: 'success', message: 'Transaction report exported successfully!' });
  };

  const handleRefund = (txn) => {
    showToast({ type: 'info', message: 'Refund API is not available yet' });
  };

  const getTypeBadge = (type) => {
    const config = {
      charging: { variant: 'success', icon: ArrowDownLeft },
      wallet_topup: { variant: 'info', icon: ArrowDownLeft },
      refund: { variant: 'warning', icon: ArrowUpRight },
      payout: { variant: 'secondary', icon: ArrowUpRight },
    };
    const typeConfig = config[type] || { variant: 'secondary', icon: ArrowUpRight };
    const Icon = typeConfig.icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${
          type === 'charging' || type === 'wallet_topup' ? 'text-green-500' : 'text-amber-500'
        }`} />
        <Badge variant={typeConfig.variant}>{type}</Badge>
      </div>
    );
  };

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'success',
      pending: 'warning',
      failed: 'danger',
      refunded: 'info',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const columns = [
    {
      key: 'id',
      label: 'Transaction ID',
      render: (value) => (
        <span className="font-mono text-sm text-secondary-900">{value}</span>
      ),
    },
    {
      key: 'userName',
      label: 'User',
      render: (value, row) => (
        <div>
          <p className="font-medium text-secondary-900">{value}</p>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      render: (value) => getTypeBadge(value),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (value, row) => (
        <span className={`font-semibold ${
          row.type === 'charging' || row.type === 'wallet_topup' ? 'text-green-600' : 'text-secondary-900'
        }`}>
          {row.type === 'refund' || row.type === 'payout' ? '-' : '+'}{formatCurrency(value || 0)}
        </span>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Method',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-secondary-400" />
          <span className="text-secondary-700">{value}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => getStatusBadge(value),
    },
    {
      key: 'timestamp',
      label: 'Date',
      render: (value) => (
        <div>
          <p className="text-secondary-900">{value ? formatDate(value) : '-'}</p>
          <p className="text-sm text-secondary-500">{value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <button
            className="p-2 text-secondary-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {row.type === 'charging' && row.status === 'completed' && (
            <button
              onClick={() => handleRefund(row)}
              className="p-2 text-secondary-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Refund"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const stats = {
    totalRevenue: transactions.filter(t => t.type === 'charging' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
    totalPayouts: transactions.filter(t => t.type === 'payout').reduce((acc, t) => acc + t.amount, 0),
    totalRefunds: transactions.filter(t => t.type === 'refund').reduce((acc, t) => acc + t.amount, 0),
    pendingCount: transactions.filter(t => t.status === 'pending').length,
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
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Transactions</h1>
          <p className="text-secondary-500 mt-1 ml-4">Monitor all financial transactions</p>
        </div>
        <Button icon={Download} onClick={handleExport}>
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-emerald-100/80">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalPayouts)}</p>
              <p className="text-sm text-emerald-100/80">Payouts</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{formatCurrency(stats.totalRefunds)}</p>
              <p className="text-sm text-emerald-100/80">Refunds</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl shadow-lg shadow-green-500/10 p-5 border border-green-500/20 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 transition-all duration-300 hover:shadow-xl hover:shadow-green-500/20 hover:scale-[1.02]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-300 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pendingCount}</p>
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
              placeholder="Search by ID or user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={Search}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-36"
            >
              <option value="all">All Types</option>
              <option value="charging">Charging</option>
              <option value="wallet_topup">Top-ups</option>
              <option value="refund">Refunds</option>
              <option value="payout">Payouts</option>
            </Select>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-36"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Select>
            <Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              icon={Calendar}
              className="w-36"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {paginatedTransactions.length > 0 ? (
        <Table
          columns={columns}
          data={paginatedTransactions}
          pagination={{
            currentPage,
            totalPages: Math.ceil(filteredTransactions.length / itemsPerPage),
            from: (currentPage - 1) * itemsPerPage + 1,
            to: Math.min(currentPage * itemsPerPage, filteredTransactions.length),
            total: filteredTransactions.length,
            onPageChange: setCurrentPage,
          }}
        />
      ) : (
        <EmptyState
          icon={Receipt}
          title="No transactions found"
          description="Try adjusting your search or filters"
        />
      )}
    </div>
  );
};

export default Transactions;
