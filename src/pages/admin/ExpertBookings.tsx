import React, { useState } from 'react';
import AdminLayout from '../../components/Layout/AdminLayout';

interface ExpertBooking {
  _id?: string;
  expertId: string;
  farmerId: string;
  farmerName: string;
  farmerEmail: string;
  expertName: string;
  expertise: string;
  consultationFee: number;
  scheduledDate: string;
  scheduledTime: string;
  topic: string;
  description: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'completed' | 'failed';
  createdAt?: string;
}

const ExpertBookings: React.FC = () => {
  const [bookings, setBookings] = useState<ExpertBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');

  React.useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/experts/bookings');
      const data = await response.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
    setLoading(false);
  };

  const updateBookingStatus = async (bookingId: string, status: ExpertBooking['status']) => {
    try {
      const response = await fetch(`/api/experts/bookings/${bookingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const data = await response.json();
      if (data.success) {
        setBookings(bookings.map(b => b._id === bookingId ? { ...b, status } : b));
      }
    } catch (error) {
      console.error('Error updating booking:', error);
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      await updateBookingStatus(bookingId, 'cancelled');
    }
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentColor = (status: string) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Expert Bookings</h1>
          <div className="text-sm font-medium text-gray-600">
            Total: {bookings.length} | Confirmed: {bookings.filter(b => b.status === 'confirmed').length}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2">
          {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`px-4 py-2 rounded capitalize ${
                filterStatus === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Bookings Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">Loading bookings...</div>
          ) : filteredBookings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No bookings found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Farmer</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Expert</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Date & Time</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Fee</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map(booking => (
                    <tr key={booking._id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">{booking.farmerName}</div>
                        <div className="text-gray-600">{booking.farmerEmail}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="font-medium">{booking.expertName}</div>
                        <div className="text-gray-600">{booking.expertise}</div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div>{new Date(booking.scheduledDate).toLocaleDateString()}</div>
                        <div className="text-gray-600">{booking.scheduledTime}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        Rs. {booking.consultationFee}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {booking.status === 'pending' && (
                          <>
                            <button
                              onClick={() => updateBookingStatus(booking._id!, 'confirmed')}
                              className="text-green-600 hover:text-green-800 mr-3"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={() => cancelBooking(booking._id!)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => updateBookingStatus(booking._id!, 'completed')}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Complete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default ExpertBookings;