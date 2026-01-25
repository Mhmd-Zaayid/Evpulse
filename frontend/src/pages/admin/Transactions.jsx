import { useState, useEffect } from 'react';
import { useNotifications } from '../../context';
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

  // Mock transactions data
  const mockTransactions = [
    { id: 'TXN001', userId: 1, userName: 'John Smith', type: 'charge', amount: 24.50, status: 'completed', stationName: 'Downtown Hub', paymentMethod: 'Credit Card', createdAt: '2026-01-25T14:30:00' },
    { id: 'TXN002', userId: 2, userName: 'Sarah Johnson', type: 'charge', amount: 18.75, status: 'completed', stationName: 'Mall Parking A', paymentMethod: 'Wallet', createdAt: '2026-01-25T13:45:00' },
    { id: 'TXN003', userId: 3, userName: 'Mike Williams', type: 'payout', amount: 1250.00, status: 'pending', stationName: '-', paymentMethod: 'Bank Transfer', createdAt: '2026-01-25T12:00:00' },
    { id: 'TXN004', userId: 4, userName: 'Emily Brown', type: 'refund', amount: 15.00, status: 'completed', stationName: 'Tech Park Station', paymentMethod: 'Credit Card', createdAt: '2026-01-25T11:30:00' },
    { id: 'TXN005', userId: 5, userName: 'David Lee', type: 'payout', amount: 2890.50, status: 'completed', stationName: '-', paymentMethod: 'Bank Transfer', createdAt: '2026-01-25T10:00:00' },
    { id: 'TXN006', userId: 6, userName: 'Lisa Anderson', type: 'charge', amount: 32.00, status: 'completed', stationName: 'Airport Terminal', paymentMethod: 'Wallet', createdAt: '2026-01-25T09:15:00' },
    { id: 'TXN007', userId: 7, userName: 'James Wilson', type: 'topup', amount: 100.00, status: 'completed', stationName: '-', paymentMethod: 'Credit Card', createdAt: '2026-01-25T08:45:00' },
    { id: 'TXN008', userId: 8, userName: 'Anna Martinez', type: 'charge', amount: 45.25, status: 'failed', stationName: 'Highway Rest Stop', paymentMethod: 'Credit Card', createdAt: '2026-01-24T22:30:00' },
    { id: 'TXN009', userId: 9, userName: 'Robert Taylor', type: 'charge', amount: 28.00, status: 'completed', stationName: 'University Campus', paymentMethod: 'Wallet', createdAt: '2026-01-24T20:15:00' },
    { id: 'TXN010', userId: 10, userName: 'Jennifer Garcia', type: 'refund', amount: 8.50, status: 'pending', stationName: 'City Hospital', paymentMethod: 'Wallet', createdAt: '2026-01-24T18:00:00' },
    { id: 'TXN011', userId: 1, userName: 'John Smith', type: 'topup', amount: 50.00, status: 'completed', stationName: '-', paymentMethod: 'Credit Card', createdAt: '2026-01-24T16:30:00' },
    { id: 'TXN012', userId: 2, userName: 'Sarah Johnson', type: 'charge', amount: 22.00, status: 'completed', stationName: 'Downtown Hub', paymentMethod: 'Credit Card', createdAt: '2026-01-24T15:00:00' },
  ];

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         txn.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    showToast({ type: 'success', message: 'Transaction report exported successfully!' });
  };

  const handleRefund = (txn) => {
    showToast({ type: 'success', message: `Refund initiated for ${txn.id}` });
  };

  const getTypeBadge = (type) => {
    const config = {
      charge: { variant: 'success', icon: ArrowDownLeft },
      topup: { variant: 'info', icon: ArrowDownLeft },
      refund: { variant: 'warning', icon: ArrowUpRight },
      payout: { variant: 'secondary', icon: ArrowUpRight },
    };
    const Icon = config[type].icon;
    return (
      <div className="flex items-center gap-2">
        <Icon className={`w-4 h-4 ${
          type === 'charge' || type === 'topup' ? 'text-green-500' : 'text-amber-500'
        }`} />
        <Badge variant={config[type].variant}>{type}</Badge>
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
          <p className="text-sm text-secondary-500">{row.stationName !== '-' ? row.stationName : 'N/A'}</p>
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
          row.type === 'charge' || row.type === 'topup' ? 'text-green-600' : 'text-secondary-900'
        }`}>
          {row.type === 'refund' || row.type === 'payout' ? '-' : '+'}{formatCurrency(value)}
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
      key: 'createdAt',
      label: 'Date',
      render: (value) => (
        <div>
          <p className="text-secondary-900">{formatDate(value)}</p>
          <p className="text-sm text-secondary-500">{new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
          {row.type === 'charge' && row.status === 'completed' && (
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
    totalRevenue: transactions.filter(t => t.type === 'charge' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
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
          <h1 className="text-2xl font-bold text-secondary-900">Transactions</h1>
          <p className="text-secondary-500 mt-1">Monitor all financial transactions</p>
        </div>
        <Button icon={Download} onClick={handleExport}>
          Export Report
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalRevenue)}</p>
              <p className="text-sm text-secondary-500">Total Revenue</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalPayouts)}</p>
              <p className="text-sm text-secondary-500">Payouts</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{formatCurrency(stats.totalRefunds)}</p>
              <p className="text-sm text-secondary-500">Refunds</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Receipt className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-secondary-900">{stats.pendingCount}</p>
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
              <option value="charge">Charges</option>
              <option value="topup">Top-ups</option>
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
