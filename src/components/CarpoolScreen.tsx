import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, Car, Clock, Phone, MapPin, Plus } from 'lucide-react';
import { BASE_URL } from '../services/api';
import { toast } from 'sonner';

interface CarpoolListing {
    _id: string;
    name: string;
    contactNumber: string;
    vehicleType: string;
    vehicleNumber: string;
    seatsAvailable: number;
    availableDays: string[];
    timeSlot: string;
    destination: string;
    provider: string; // userId
}

export default function CarpoolScreen({ onNavigate }: { onNavigate: (screen: string) => void }) {
    const [listings, setListings] = useState<CarpoolListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [visibleContacts, setVisibleContacts] = useState<{ [key: string]: boolean }>({});
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        fetchListings();
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setCurrentUserId(user._id || user.id);
            } catch (e) { }
        }
    }, []);

    const fetchListings = async () => {
        try {
            const token = localStorage.getItem('token');
            // Using localhost for now since that's what other components seem to rely on based on my knowledge or assuming proxy
            const response = await fetch(`${BASE_URL}/carpool`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setListings(data);
            } else {
                setListings([]);
            }
        } catch (error) {
            toast.error('Failed to load carpool listings');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleContact = (id: string) => {
        setVisibleContacts(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete your carpool offer?')) return;

        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${BASE_URL}/carpool/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success('Listing removed');
                setListings(prev => prev.filter(item => item._id !== id));
            } else {
                toast.error('Failed to remove listing');
            }
        } catch (error) {
            toast.error('Error removing listing');
        }
    };

    return (
        <div className="h-full bg-gray-50 flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => onNavigate('home')}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6 text-gray-700" />
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Carpooling</h1>
                </div>
                <button
                    onClick={() => onNavigate('carpool-form')}
                    className="bg-[#027A4C] text-white p-2 rounded-full shadow-lg hover:bg-[#026940] transition-transform active:scale-95"
                >
                    <Plus className="w-6 h-6" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex justify-center pt-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#027A4C]"></div>
                    </div>
                ) : listings.length === 0 ? (
                    <div className="text-center pt-20 px-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Car className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Rides Available</h3>
                        <p className="text-gray-500 mb-6">Be the first to offer a carpool ride to your neighbors!</p>
                        <button
                            onClick={() => onNavigate('carpool-form')}
                            className="px-6 py-3 bg-[#027A4C] text-white rounded-xl font-medium shadow-sm hover:bg-[#026940]"
                        >
                            Offer Carpool
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4 pb-20">
                        {listings.map(item => (
                            <div key={item._id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative">
                                {currentUserId === item.provider && (
                                    <button
                                        onClick={(e) => handleDelete(item._id, e)}
                                        className="absolute top-4 right-4 text-xs font-medium text-red-500 bg-red-50 px-2 py-1 rounded-md"
                                    >
                                        Delete My Offer
                                    </button>
                                )}

                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 bg-[#F1F8F4] rounded-full flex items-center justify-center text-[#027A4C]">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1">
                                            <Car className="w-3 h-3" /> {item.vehicleType} &bull; {item.seatsAvailable} Seats
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{item.timeSlot}</p>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {item.availableDays.map(day => (
                                                    <span key={day} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                                        {day}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    {item.destination && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                            <p className="text-sm text-gray-700">To: {item.destination}</p>
                                        </div>
                                    )}
                                </div>

                                {visibleContacts[item._id] ? (
                                    <div className="bg-[#F1F8F4] p-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                                        <span className="font-bold text-[#027A4C] text-lg">{item.contactNumber}</span>
                                        <a href={`tel:${item.contactNumber}`} className="bg-white p-2 rounded-full text-[#027A4C]">
                                            <Phone className="w-4 h-4" />
                                        </a>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => toggleContact(item._id)}
                                        className="w-full py-3 border border-[#027A4C] text-[#027A4C] rounded-xl font-semibold hover:bg-[#F1F8F4] transition-colors"
                                    >
                                        View Contact
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
