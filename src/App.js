import React, { useState, useEffect } from 'react';
import { Plus, Check, Clock, MapPin, Users, Briefcase, Mail, X, Edit, DollarSign, UserPlus, MessageSquare, Leaf } from 'lucide-react';

const AirportJointMobility = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [baseCost] = useState(50);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    phone: ''
  });
  const [contactData, setContactData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    movementType: 'to-airport',
    address: '',
    passengers: 1,
    luggage: 1,
    midpointAddress: '',
    notes: '',
    carpoolOpen: false
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const bookingsResult = await window.storage.get('ajm-bookings', true);
      if (bookingsResult && bookingsResult.value) {
        setBookings(JSON.parse(bookingsResult.value));
      }
    } catch (error) {
      console.log('No existing bookings');
    }

    try {
      const usersResult = await window.storage.get('ajm-users', true);
      if (usersResult && usersResult.value) {
        setUsers(JSON.parse(usersResult.value));
      } else {
        const initialUsers = [{
          id: 1,
          email: 'admin@airportjointmobility.com',
          password: 'admin123',
          name: 'Platform Administrator',
          role: 'admin',
          status: 'approved',
          organization: 'Airport Joint Mobility'
        }];
        await window.storage.set('ajm-users', JSON.stringify(initialUsers), true);
        setUsers(initialUsers);
      }
    } catch (error) {
      console.log('Initializing users');
    }
  };

  const saveBookings = async (newBookings) => {
    try {
      await window.storage.set('ajm-bookings', JSON.stringify(newBookings), true);
      setBookings(newBookings);
    } catch (error) {
      alert('Failed to save booking. Please try again.');
    }
  };

  const saveUsers = async (newUsers) => {
    try {
      await window.storage.set('ajm-users', JSON.stringify(newUsers), true);
      setUsers(newUsers);
    } catch (error) {
      alert('Failed to save user data. Please try again.');
    }
  };

  const handleLogin = () => {
    const user = users.find(u => u.email === loginData.email && u.password === loginData.password);
    if (!user) {
      alert('Invalid email or password');
      return;
    }
    if (user.status !== 'approved') {
      alert('Your account is pending approval. Please contact the administrator.');
      return;
    }
    setCurrentUser(user);
    setShowLogin(false);
    setLoginData({ email: '', password: '' });
  };

  const handleRegister = () => {
    if (!registerData.name || !registerData.email || !registerData.password || !registerData.organization) {
      alert('Please fill in all required fields');
      return;
    }
    
    if (users.find(u => u.email === registerData.email)) {
      alert('This email is already registered');
      return;
    }

    const newUser = {
      id: Date.now(),
      ...registerData,
      role: 'user',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    saveUsers([...users, newUser]);
    alert('Registration submitted! Your account is pending approval. You will be notified via email once approved.');
    setShowRegister(false);
    setRegisterData({ name: '', email: '', password: '', organization: '', phone: '' });
  };

  const handleContactSubmit = () => {
    if (!contactData.name || !contactData.email || !contactData.subject || !contactData.message) {
      alert('Please fill in all fields');
      return;
    }
    
    alert(`Thank you for contacting us! We will respond to ${contactData.email} within 24 hours.`);
    setShowContact(false);
    setContactData({ name: '', email: '', subject: '', message: '' });
  };

  const calculateCost = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const dayStart = 6 * 60;
    const dayEnd = 21 * 60;
    
    if (totalMinutes >= dayStart && totalMinutes <= dayEnd) {
      return baseCost;
    }
    return baseCost * 1.5;
  };

  const isWithin72Hours = (date, time) => {
    const bookingDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    const hoursDiff = (bookingDateTime - now) / (1000 * 60 * 60);
    return hoursDiff < 72;
  };

  const handleSubmit = () => {
    if (!formData.date || !formData.time || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }

    if (isWithin72Hours(formData.date, formData.time)) {
      alert('Bookings must be made at least 72 hours in advance');
      return;
    }

    const bookingData = {
      id: editingBooking ? editingBooking.id : Date.now(),
      userId: currentUser.id,
      userName: currentUser.name,
      userEmail: currentUser.email,
      organization: currentUser.organization,
      ...formData,
      cost: calculateCost(formData.time),
      status: editingBooking ? editingBooking.status : 'pending',
      createdAt: editingBooking ? editingBooking.createdAt : new Date().toISOString(),
      carpoolRequests: editingBooking ? (editingBooking.carpoolRequests || []) : []
    };

    let updatedBookings;
    if (editingBooking) {
      updatedBookings = bookings.map(b => b.id === editingBooking.id ? bookingData : b);
      alert(`Booking updated! ${bookingData.status === 'confirmed' ? 'Confirmation' : 'Update notification'} email will be sent to ${currentUser.email}`);
    } else {
      updatedBookings = [...bookings, bookingData];
      alert(`Booking created! A notification email will be sent to ${currentUser.email}`);
    }

    updatedBookings.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
    saveBookings(updatedBookings);
    
    setShowForm(false);
    setEditingBooking(null);
    setFormData({
      date: '',
      time: '',
      movementType: 'to-airport',
      address: '',
      passengers: 1,
      luggage: 1,
      midpointAddress: '',
      notes: '',
      carpoolOpen: false
    });
  };

  const toggleConfirmation = (booking) => {
    const newStatus = booking.status === 'confirmed' ? 'pending' : 'confirmed';
    const updatedBookings = bookings.map(b =>
      b.id === booking.id ? { ...b, status: newStatus } : b
    );
    saveBookings(updatedBookings);
    
    const action = newStatus === 'confirmed' ? 'confirmed' : 'rejected';
    alert(`Booking ${action}! Email notification sent to ${booking.userEmail}`);
  };

  const deleteBooking = (booking) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      const updatedBookings = bookings.filter(b => b.id !== booking.id);
      saveBookings(updatedBookings);
      alert(`Booking cancelled! Cancellation email sent to ${booking.userEmail}`);
    }
  };

  const startEdit = (booking) => {
    setEditingBooking(booking);
    setFormData({
      date: booking.date,
      time: booking.time,
      movementType: booking.movementType,
      address: booking.address,
      passengers: booking.passengers,
      luggage: booking.luggage,
      midpointAddress: booking.midpointAddress || '',
      notes: booking.notes || '',
      carpoolOpen: booking.carpoolOpen || false
    });
    setShowForm(true);
  };

  const requestCarpool = (booking) => {
    if (booking.userId === currentUser.id) {
      alert('This is your own booking');
      return;
    }
    
    const updatedBookings = bookings.map(b => {
      if (b.id === booking.id) {
        const requests = b.carpoolRequests || [];
        if (requests.find(r => r.userId === currentUser.id)) {
          alert('You have already requested to carpool for this trip');
          return b;
        }
        return {
          ...b,
          carpoolRequests: [...requests, {
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            requestedAt: new Date().toISOString()
          }]
        };
      }
      return b;
    });
    
    saveBookings(updatedBookings);
    alert(`Carpool request sent to ${booking.userName}! They will be notified via email at ${booking.userEmail}`);
  };

  const approveUser = (userId) => {
    const updatedUsers = users.map(u =>
      u.id === userId ? { ...u, status: 'approved' } : u
    );
    saveUsers(updatedUsers);
    const user = users.find(u => u.id === userId);
    alert(`User approved! Approval email will be sent to ${user.email}`);
  };

  const rejectUser = (userId) => {
    if (window.confirm('Are you sure you want to reject this user registration?')) {
      const user = users.find(u => u.id === userId);
      const updatedUsers = users.filter(u => u.id !== userId);
      saveUsers(updatedUsers);
      alert(`User registration rejected. Notification email sent to ${user.email}`);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (showLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-amber-200 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <svg className="w-16 h-10" viewBox="0 0 200 100" fill="none">
                <ellipse cx="50" cy="50" rx="45" ry="48" fill="#F4D03F"/>
                <ellipse cx="100" cy="50" rx="45" ry="48" fill="#F4D03F"/>
                <ellipse cx="150" cy="50" rx="45" ry="48" fill="#F4D03F"/>
                <line x1="35" y1="30" x2="65" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <line x1="85" y1="30" x2="115" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <line x1="135" y1="30" x2="165" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <circle cx="35" cy="30" r="6" fill="white"/>
                <circle cx="65" cy="70" r="6" fill="white"/>
                <circle cx="85" cy="30" r="6" fill="white"/>
                <circle cx="115" cy="70" r="6" fill="white"/>
                <circle cx="135" cy="30" r="6" fill="white"/>
                <circle cx="165" cy="70" r="6" fill="white"/>
              </svg>
              <h1 className="text-3xl font-bold text-gray-800">Airport Joint Mobility</h1>
            </div>
            <p className="text-gray-600">Shared Transportation Platform</p>
          </div>

          {!showRegister && !showContact ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Login</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="your.email@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter your password"
                />
              </div>
              <button
                onClick={handleLogin}
                className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Login
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRegister(true)}
                  className="flex-1 border-2 border-amber-500 text-amber-600 py-2 rounded-lg hover:bg-amber-50 transition-colors font-medium"
                >
                  Register
                </button>
                <button
                  onClick={() => setShowContact(true)}
                  className="flex-1 border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Contact Us
                </button>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                <strong>Demo Login:</strong> admin@airportjointmobility.com / admin123
              </div>
            </div>
          ) : showRegister ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Register New Account</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                <input
                  type="text"
                  value={registerData.organization}
                  onChange={(e) => setRegisterData({ ...registerData, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                onClick={handleRegister}
                className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Submit Registration
              </button>
              <button
                onClick={() => setShowRegister(false)}
                className="w-full border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Contact Us</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input
                  type="text"
                  value={contactData.name}
                  onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Email *</label>
                <input
                  type="email"
                  value={contactData.email}
                  onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                <input
                  type="text"
                  value={contactData.subject}
                  onChange={(e) => setContactData({ ...contactData, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Registration inquiry, Technical support"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                <textarea
                  value={contactData.message}
                  onChange={(e) => setContactData({ ...contactData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  rows="4"
                />
              </div>
              <button
                onClick={handleContactSubmit}
                className="w-full bg-amber-500 text-white py-3 rounded-lg hover:bg-amber-600 transition-colors font-medium"
              >
                Send Message
              </button>
              <button
                onClick={() => setShowContact(false)}
                className="w-full border-2 border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Login
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 to-amber-200 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <svg className="w-12 h-8" viewBox="0 0 200 100" fill="none">
                <ellipse cx="50" cy="50" rx="45" ry="48" fill="#F4D03F"/>
                <ellipse cx="100" cy="50" rx="45" ry="48" fill="#F4D03F"/>
                <ellipse cx="150" cy="50" rx="45" ry="48" fill="#F4D03F"/>
                <line x1="35" y1="30" x2="65" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <line x1="85" y1="30" x2="115" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <line x1="135" y1="30" x2="165" y2="70" stroke="white" strokeWidth="8" strokeLinecap="round"/>
                <circle cx="35" cy="30" r="6" fill="white"/>
                <circle cx="65" cy="70" r="6" fill="white"/>
                <circle cx="85" cy="30" r="6" fill="white"/>
                <circle cx="115" cy="70" r="6" fill="white"/>
                <circle cx="135" cy="30" r="6" fill="white"/>
                <circle cx="165" cy="70" r="6" fill="white"/>
              </svg>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Airport Joint Mobility</h1>
                <p className="text-gray-600">Welcome, {currentUser.name} ({currentUser.role})</p>
              </div>
            </div>
            <div className="flex gap-2">
              {currentUser.role !== 'driver' && (
                <button
                  onClick={() => {
                    setEditingBooking(null);
                    setShowForm(!showForm);
                  }}
                  className="flex items-center gap-2 bg-amber-500 text-white px-6 py-3 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  New Booking
                </button>
              )}
              <button
                onClick={() => {
                  setCurrentUser(null);
                  setShowLogin(true);
                }}
                className="px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {currentUser.role === 'admin' && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Pending User Approvals</h2>
            {users.filter(u => u.status === 'pending').length === 0 ? (
              <p className="text-gray-500">No pending approvals</p>
            ) : (
              <div className="space-y-3">
                {users.filter(u => u.status === 'pending').map(user => (
                  <div key={user.id} className="border-2 border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{user.name}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-sm text-gray-600">{user.organization}</p>
                        {user.phone && <p className="text-sm text-gray-600">Phone: {user.phone}</p>}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveUser(user.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => rejectUser(user.id)}
                          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              {editingBooking ? 'Edit Booking' : 'Create New Booking'}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Movement Type *
                  </label>
                  <select
                    value={formData.movementType}
                    onChange={(e) => setFormData({ ...formData, movementType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="to-airport">To Airport</option>
                    <option value="from-airport">From Airport</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date * (Min. 72 hours advance)
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {formData.time && (
                    <p className="text-sm text-gray-600 mt-1">
                      <DollarSign className="w-4 h-4 inline" />
                      Cost: {calculateCost(formData.time)} {calculateCost(formData.time) > baseCost ? '(Night rate: 1.5x)' : '(Day rate)'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.movementType === 'to-airport' ? 'Pickup Address *' : 'Dropoff Address *'}
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                    placeholder={formData.movementType === 'to-airport' ? 'Where to pick you up' : 'Where to drop you off'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Passengers *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.passengers}
                    onChange={(e) => setFormData({ ...formData, passengers: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Luggage Quantity *
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={formData.luggage}
                    onChange={(e) => setFormData({ ...formData, luggage: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Midpoint Address (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.midpointAddress}
                    onChange={(e) => setFormData({ ...formData, midpointAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="Stop for mail collection or additional passengers"
                  />
                </div>

                {formData.passengers === 1 && !editingBooking && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.carpoolOpen}
                        onChange={(e) => setFormData({ ...formData, carpoolOpen: e.target.checked })}
                        className="w-4 h-4 text-indigo-600"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Leaf className="w-5 h-5 text-green-600" />
                        Do you want to carpool and protect the environment?
                      </span>
                    </label>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Additional Notes
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    rows="3"
                    placeholder="Any special requirements or notes"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setEditingBooking(null);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                >
                  {editingBooking ? 'Update Booking' : 'Create Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Scheduled Bookings</h2>
          
          {bookings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              < className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No bookings yet. Create your first booking to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className={`border-2 rounded-lg p-4 ${getStatusColor(booking.status)}`}
                >
                  <div className="flex items-start justify-between mb-3 flex-wrap gap-2">
                    <div>
                      <h3 className="text-lg font-bold">{booking.userName}</h3>
                      <p className="text-sm text-gray-600">{booking.organization}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          < className="w-4 h-4" />
                          {new Date(booking.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.time}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                          {booking.movementType === 'to-airport' ? 'To Airport' : 'From Airport'}
                        </span>
                        <span className="flex items-center gap-1 text-amber-700 font-medium">
                          <DollarSign className="w-4 h-4" />
                          {booking.cost}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {(currentUser.role === 'driver' || currentUser.role === 'admin') && (
                        <button
                          onClick={() => toggleConfirmation(booking)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                            booking.status === 'confirmed'
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <Check className="w-4 h-4" />
                          {booking.status === 'confirmed' ? 'Confirmed' : 'Confirm'}
                        </button>
                      )}
                      {(booking.userId === currentUser.id || currentUser.role === 'admin') && (
                        <>
                          <button
                            onClick={() => startEdit(booking)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => deleteBooking(booking)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </>
                      )}
                      {booking.carpoolOpen && booking.userId !== currentUser.id && currentUser.role !== 'driver' && (
                        <button
                          onClick={() => requestCarpool(booking)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Leaf className="w-4 h-4" />
                          Request Carpool
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-medium">
                          {booking.movementType === 'to-airport' ? 'Pickup:' : 'Dropoff:'}
                        </span> {booking.address}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span><span className="font-medium">Passengers:</span> {booking.passengers}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      <span><span className="font-medium">Luggage:</span> {booking.luggage}</span>
                    </div>
                    {booking.midpointAddress && (
                      <div className="flex items-start gap-2 md:col-span-2">
                        <Mail className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium">Midpoint:</span> {booking.midpointAddress}
                        </div>
                      </div>
                    )}
                    {booking.notes && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Notes:</span> {booking.notes}
                      </div>
                    )}
                    {booking.carpoolOpen && (
                      <div className="md:col-span-2 flex items-center gap-2 text-green-700">
                        <Leaf className="w-4 h-4" />
                        <span className="font-medium">Open to carpooling</span>
                      </div>
                    )}
                    {booking.carpoolRequests && booking.carpoolRequests.length > 0 && (
                      <div className="md:col-span-2">
                        <span className="font-medium">Carpool Requests:</span>
                        <ul className="ml-4 mt-1">
                          {booking.carpoolRequests.map((req, idx) => (
                            <li key={idx} className="text-xs">
                              {req.userName} ({req.userEmail})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Platform Features:</h3>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li><strong>User Registration:</strong> New users register and wait for admin approval</li>
            <li><strong>72-Hour Advance Booking:</strong> All bookings must be made at least 72 hours in advance</li>
            <li><strong>Dynamic Pricing:</strong> Day rate (6:00 AM - 9:00 PM) = {baseCost}, Night rate (9:01 PM - 5:59 AM) = {baseCost * 1.5}</li>
            <li><strong>Carpool Option:</strong> Single passengers can open their trip for carpooling</li>
            <li><strong>Email Notifications:</strong> Automatic emails for booking confirmations, cancellations, and updates</li>
            <li><strong>Edit & Cancel:</strong> Users can edit or cancel their bookings; driver/admin can confirm trips</li>
            <li><strong>Contact Support:</strong> Use the Contact Us form for registration questions or support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AirportJointMobility;