import React, { useState, useEffect } from 'react';
import { ArrowLeft, Car, Calendar, Clock, MapPin, Users } from 'lucide-react';
import { BASE_URL } from '../services/api';
import { toast } from 'sonner';

export default function CarpoolForm({ onNavigate }: { onNavigate: (screen: string) => void }) {
    const [formData, setFormData] = useState({
        contactNumber: '',
        vehicleType: 'Car',
        vehicleNumber: '',
        seatingCapacity: 4,
        seatsAvailable: 3,
        availableDays: [] as string[],
        timeSlot: '',
        destination: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const societyName = "ABC Residency – Main Gate"; // Fixed location

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const toggleDay = (day: string) => {
        setFormData(prev => {
            const currentDays = prev.availableDays;
            if (currentDays.includes(day)) {
                return { ...prev, availableDays: currentDays.filter(d => d !== day) };
            } else {
                return { ...prev, availableDays: [...currentDays, day] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.availableDays.length === 0) {
            toast.error('Please select at least one available day');
            return;
        }

        setIsSubmitting(true);

        try {
            const userStr = localStorage.getItem('user');
            const token = localStorage.getItem('token');

            if (!userStr || !token) {
                toast.error('You must be logged in');
                onNavigate('login');
                return;
            }

            // Check if running on localhost or deployed URL, assume relative path proxy or hardcoded for now based on context
            // Using relative path /api as per other components likely usage
            const response = await fetch(`${BASE_URL}/carpool`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create listing');
            }

            toast.success('Carpool listing created successfully!');
            onNavigate('carpool'); // Go back to list
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center gap-3 shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => onNavigate('carpool')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-700" />
                </button>
                <h1 className="text-xl font-bold text-gray-900">Offer Carpool</h1>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                <form onSubmit={handleSubmit} className="space-y-6 pb-8">

                    {/* Contact Info */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4" /> CONTACT DETAILS
                        </h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number</label>
                            <input
                                type="tel"
                                required
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                placeholder="0300-1234567"
                                value={formData.contactNumber}
                                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })}
                            />
                            <p className="text-xs text-gray-500 mt-1">Residents will call/WhatsApp you on this number.</p>
                        </div>
                    </div>

                    {/* Vehicle Info */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <Car className="w-4 h-4" /> VEHICLE DETAILS
                        </h3>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Type</label>
                                <select
                                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                    value={formData.vehicleType}
                                    onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                                >
                                    <option value="Car">Car</option>
                                    <option value="Bike">Bike</option>
                                    <option value="Van">Van</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle No.</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                    placeholder="ABC-123"
                                    value={formData.vehicleNumber}
                                    onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Total Capacity</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                    value={formData.seatingCapacity}
                                    onChange={e => setFormData({ ...formData, seatingCapacity: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Seats Available</label>
                                <input
                                    type="number"
                                    min="1"
                                    required
                                    className="w-full px-3 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                    value={formData.seatsAvailable}
                                    onChange={e => setFormData({ ...formData, seatsAvailable: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Schedule */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> SCHEDULE
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Available Days</label>
                            <div className="flex flex-wrap gap-2">
                                {days.map(day => (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.availableDays.includes(day)
                                            ? 'bg-[#027A4C] text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Time Slot</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                    placeholder="e.g. Morning 8:00 AM"
                                    value={formData.timeSlot}
                                    onChange={e => setFormData({ ...formData, timeSlot: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Route */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4" /> ROUTE
                        </h3>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                            <input
                                type="text"
                                disabled
                                className="w-full px-4 py-3 rounded-xl bg-gray-100 text-gray-500 border border-gray-200 cursor-not-allowed"
                                value={societyName}
                            />
                            <p className="text-xs text-gray-500 mt-1">All rides must start from society.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Destination Area (Optional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#027A4C]"
                                placeholder="e.g. Saddar, Clifton, University"
                                value={formData.destination}
                                onChange={e => setFormData({ ...formData, destination: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-xl bg-[#027A4C] text-white font-bold text-lg shadow-lg hover:bg-[#026940] transition-transform active:scale-95 disabled:opacity-70"
                    >
                        {isSubmitting ? 'Submitting...' : 'Offer Carpool'}
                    </button>

                </form>
            </div>
        </div>
    );
}
