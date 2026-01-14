import React from 'react';
import { Car } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function CarpoolManagement() {
    const { theme } = useTheme();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Carpool Management
                    </h1>
                    <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
                        Manage residency carpool listings
                    </p>
                </div>
            </div>

            <div className={`${theme === 'dark' ? 'bg-[#1A1A1A] border-[#333333]' : 'bg-white border-gray-200'} border rounded-2xl p-8 text-center`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-[#2A2A2A]' : 'bg-gray-100'}`}>
                    <Car className="w-8 h-8 text-[#00c878]" />
                </div>
                <h3 className={`text-lg font-medium mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Carpool Management
                </h3>
                <p className={`max-w-md mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    This feature is under development. You will be able to manage carpool listings here.
                </p>
            </div>
        </div>
    );
}
