import { useState, useEffect } from 'react';
import { useAuth, useNotifications } from '../../context';
import { transactionsAPI } from '../../services';
import { formatCurrency, formatDate, formatDateTime } from '../../utils';
import { Button, Badge, Modal, Input, Table, StatCard, LoadingSpinner } from '../../components';
import {
  Wallet,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Download,
  Filter,
  Zap,
  Receipt,
  CheckCircle,
} from 'lucide-react';

const Payments = () => {
  const { user } = useAuth();
  const { showToast } = useNotifications();
  
  const [transactions, setTransactions] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPaymentData();
  }, []);

  const fetchPaymentData = async () => {
    try {
      const [transRes, walletRes] = await Promise.all([
        transactionsAPI.getByUser(user.id),
        transactionsAPI.getWalletBalance(user.id),
      ]);
      setTransactions(transRes.data);
      setWalletBalance(walletRes.data.balance);
    } catch (error) {
      console.error('Failed to fetch payment data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      showToast({ type: 'error', message: 'Please enter a valid amount' });
      return;
    }

    setProcessing(true);
    setShowTopUpModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async () => {
    try {
      const response = await transactionsAPI.topUpWallet(parseFloat(topUpAmount), paymentMethod);
      if (response.success) {
        setWalletBalance(response.data.newBalance);
        setTransactions(prev => [{
          id: response.data.transactionId,
          userId: user.id,
          amount: parseFloat(topUpAmount),
          type: 'wallet_topup',
          paymentMethod: paymentMethod === 'card' ? 'Card' : paymentMethod === 'upi' ? 'UPI' : 'Wallet',
          status: 'completed',
          timestamp: new Date().toISOString(),
          description: 'Wallet Top-up',
        }, ...prev]);
        showToast({ type: 'success', message: `Successfully added ${formatCurrency(parseFloat(topUpAmount))} to wallet` });
      }
    } catch (error) {
      showToast({ type: 'error', message: 'Payment failed. Please try again.' });
    } finally {
      setProcessing(false);
      setShowPaymentModal(false);
      setTopUpAmount('');
    }
  };

  const quickAmounts = [20, 50, 100, 200];

  const totalSpent = transactions
    .filter(t => t.type === 'charging')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTopUps = transactions
    .filter(t => t.type === 'wallet_topup')
    .reduce((sum, t) => sum + t.amount, 0);

  const columns = [
    {
      key: 'description',
      label: 'Description',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            row.type === 'charging' ? 'bg-primary-100' : 'bg-green-100'
          }`}>
            {row.type === 'charging' ? (
              <Zap className="w-5 h-5 text-primary-600" />
            ) : (
              <Plus className="w-5 h-5 text-green-600" />
            )}
          </div>
          <div>
            <p className="font-medium text-secondary-900">{row.description}</p>
            <p className="text-sm text-secondary-500">{formatDateTime(row.timestamp)}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'paymentMethod',
      label: 'Payment Method',
      render: (row) => (
        <div className="flex items-center gap-2">
          {row.paymentMethod === 'Card' && <CreditCard className="w-4 h-4 text-secondary-400" />}
          {row.paymentMethod === 'UPI' && <Smartphone className="w-4 h-4 text-secondary-400" />}
          {row.paymentMethod === 'Wallet' && <Wallet className="w-4 h-4 text-secondary-400" />}
          <span className="text-secondary-700">
            {row.paymentMethod}
            {row.cardLast4 && ` •••• ${row.cardLast4}`}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge variant={row.status === 'completed' ? 'success' : 'warning'}>
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <div className={`flex items-center gap-1 font-semibold ${
          row.type === 'charging' ? 'text-red-600' : 'text-green-600'
        }`}>
          {row.type === 'charging' ? (
            <ArrowUpRight className="w-4 h-4" />
          ) : (
            <ArrowDownRight className="w-4 h-4" />
          )}
          {row.type === 'charging' ? '-' : '+'}{formatCurrency(row.amount)}
        </div>
      ),
    },
  ];

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
          <h1 className="text-2xl font-bold text-secondary-900 ml-4">Payments & Wallet</h1>
          <p className="text-secondary-500 mt-1">Manage your payments and transaction history</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" icon={Download}>
            Export
          </Button>
          <Button icon={Plus} onClick={() => setShowTopUpModal(true)}>
            Add Money
          </Button>
        </div>
      </div>

      {/* Wallet & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="space-y-4">
          <StatCard
            title="Wallet Balance"
            value={formatCurrency(walletBalance)}
            icon={Wallet}
            iconColor="bg-white/20 text-white"
            gradient={true}
            className="bg-gradient-to-br from-primary-500 to-primary-600"
          />
          <Button 
            variant="secondary" 
            fullWidth 
            onClick={() => setShowTopUpModal(true)}
            className="bg-white hover:bg-secondary-50 text-primary-600 border-white"
          >
            Top Up Wallet
          </Button>
        </div>

        <StatCard
          title="Total Spent"
          value={formatCurrency(totalSpent)}
          icon={ArrowUpRight}
          iconColor="bg-red-100 text-red-600"
        />

        <StatCard
          title="Total Top-ups"
          value={formatCurrency(totalTopUps)}
          icon={ArrowDownRight}
          iconColor="bg-green-100 text-green-600"
        />
      </div>

      {/* Payment Methods */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900">Payment Methods</h2>
          <Button variant="ghost" size="sm">
            Add New
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border-2 border-primary-500 bg-primary-50 rounded-xl">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-primary-600" />
              <div>
                <p className="font-medium text-secondary-900">•••• 4242</p>
                <p className="text-sm text-secondary-500">Expires 12/27</p>
              </div>
            </div>
            <Badge variant="primary" className="mt-3">Default</Badge>
          </div>
          <div className="p-4 border border-secondary-200 rounded-xl hover:border-primary-300 cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <Smartphone className="w-8 h-8 text-secondary-600" />
              <div>
                <p className="font-medium text-secondary-900">UPI</p>
                <p className="text-sm text-secondary-500">user@upi</p>
              </div>
            </div>
          </div>
          <div className="p-4 border border-dashed border-secondary-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-primary-400 hover:bg-primary-50 transition-all">
            <div className="text-center">
              <Plus className="w-6 h-6 text-secondary-400 mx-auto" />
              <p className="text-sm text-secondary-500 mt-1">Add Payment Method</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900">Transaction History</h2>
          <Button variant="ghost" size="sm" icon={Filter}>
            Filter
          </Button>
        </div>
        <Table
          columns={columns}
          data={transactions}
          emptyMessage="No transactions yet"
        />
      </div>

      {/* Top Up Modal */}
      <Modal
        isOpen={showTopUpModal}
        onClose={() => {
          setShowTopUpModal(false);
          setTopUpAmount('');
        }}
        title="Add Money to Wallet"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="input-label">Enter Amount</label>
              <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-500 text-lg">₹</span>
              <input
                type="number"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="0.00"
                className="input-field pl-8 text-2xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="input-label">Quick Select</label>
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopUpAmount(amount.toString())}
                  className={`py-3 rounded-xl border-2 font-medium transition-all ${
                    topUpAmount === amount.toString()
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-primary-300'
                  }`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="input-label">Payment Method</label>
            <div className="space-y-2">
              {[
                { id: 'card', icon: CreditCard, label: 'Credit/Debit Card', sub: '•••• 4242' },
                { id: 'upi', icon: Smartphone, label: 'UPI', sub: 'user@upi' },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                    paymentMethod === method.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-secondary-200 hover:border-primary-300'
                  }`}
                >
                  <method.icon className="w-6 h-6 text-secondary-600" />
                  <div className="text-left">
                    <p className="font-medium text-secondary-900">{method.label}</p>
                    <p className="text-sm text-secondary-500">{method.sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <Button fullWidth onClick={handleTopUp} disabled={!topUpAmount}>
            Continue to Payment
          </Button>
        </div>
      </Modal>

      {/* Payment Processing Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => {}}
        title="Processing Payment"
        size="sm"
        showCloseButton={false}
      >
        <div className="text-center py-6">
          {processing ? (
            <>
              <LoadingSpinner size="lg" className="mb-4" />
              <p className="text-secondary-600">Processing your payment...</p>
              <p className="text-sm text-secondary-400 mt-1">Please don't close this window</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-secondary-900">Payment Successful!</h3>
              <p className="text-secondary-500 mt-1">
                {formatCurrency(parseFloat(topUpAmount))} has been added to your wallet
              </p>
              <Button fullWidth className="mt-6" onClick={handlePaymentComplete}>
                Done
              </Button>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Payments;
