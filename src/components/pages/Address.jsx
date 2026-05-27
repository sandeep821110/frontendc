import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios'
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Edit, Trash2, Loader2, XCircle, Home, Phone, User, Mail, CheckCircle2 } from 'lucide-react';
import BrandLoader from '../BrandLoader';
import { logout } from '../../features/auth/authSlice';
import { createApiClient, getAuthToken } from '../../services/apiClient';

const addressApi = createApiClient('/api/address')
const API_BASE_URL = '/api/address'

const Address = ({ isModal = false }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentAddress, setCurrentAddress] = useState(null);
    const [formError, setFormError] = useState('');

    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    const userEmail = useSelector(state => state.auth.user?.email || '');
 
    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const currentToken = getAuthToken();
            const tokenPreview = currentToken ? currentToken.substring(0, 20) + '...' : 'null';


            const res = await addressApi.get('/');

            setAddresses(res.data.addresses || []);
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message || err.response?.data?.error;
            const fullResponse = JSON.stringify(err.response?.data);


            if (err.code === 'ERR_NETWORK') {

            } else if (status === 401) {

                setError('Your session has expired. Please log in again.');
                setTimeout(() => {
                    dispatch(logout());
                    navigate('/login', { state: { from: location.pathname } });
                }, 2000);
                return;
            } else if (status === 404) {

            } else if (status === 500) {

            }
            setError(serverMsg || `Error fetching addresses (${status || 'network error'}).`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleEdit = useCallback((address) => {
        setIsEditing(true);
        setCurrentAddress(address);
        setFormError('');
        setShowForm(true);
    }, []);

    useEffect(() => {
        if (location.state?.editAddress && addresses.length > 0) {
            const addressToEdit = addresses.find(a => a._id === location.state.editAddress._id) || location.state.editAddress;
            handleEdit(addressToEdit);
            navigate(location.pathname, { replace: true, state: {} });
        }
    }, [location.state, addresses, navigate, handleEdit]);

    const handleAddNew = () => {
        setIsEditing(false);
        setCurrentAddress({
            fullName: "",
            phoneNumber: "",
            addressLine1: "",
            city: "",
            pincode: "",
            landmark: "",
            isDefault: false
        });
        setFormError('');
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {

                const res = await addressApi.delete(`/${id}`);

                setAddresses(prev => prev.filter(addr => addr._id !== id));
            } catch (err) {
                const status = err.response?.status;
                const serverMsg = err.response?.data?.message || err.response?.data?.error;

                setError(serverMsg || `Error deleting address (${status || 'network error'}).`);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            const method = isEditing ? 'PUT' : 'POST';
            const endpoint = isEditing ? `/${currentAddress._id}` : '/';

            const res = isEditing ? await addressApi.put(endpoint, formData) : await addressApi.post(endpoint, formData);

            setShowForm(false);
            fetchAddresses();
            navigate('/checkout');
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message || err.response?.data?.error;
            setFormError(serverMsg || `Error saving address (${status || 'network error'}).`);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

  return (
    <div className={isModal ? "bg-gray-50 h-full" : "min-h-screen bg-gray-50"}>
        <div className={`max-w-4xl mx-auto ${isModal ? 'p-4 sm:p-8' : 'py-6 sm:py-12 px-3 sm:px-4'}`}>
            <div className="flex justify-between items-center mb-4 sm:mb-8">
                <div className="flex items-center gap-2 sm:gap-3">
                    <MapPin className="text-indigo-600 w-6 h-6 sm:w-8 sm:h-8" size={32} />
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Addresses</h1>
                </div>
                <button
                    onClick={handleAddNew}
                    className="inline-flex items-center gap-1 sm:gap-2 bg-indigo-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 rounded-xl font-bold hover:bg-indigo-700 transition text-sm sm:text-base"
                >
                    <Plus size={16} />
                    <span className="hidden sm:inline">Add New</span>
                    <span className="sm:hidden">Add</span>
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
                    <XCircle className="text-red-600" size={20} />
                    <span className="text-red-700 font-semibold">{error}</span>
                </div>
            )}

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-start z-50 p-2 sm:p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
                    <AddressForm
                        address={currentAddress}
                        onSubmit={handleFormSubmit}
                        onCancel={() => { setShowForm(false); setFormError(''); }}
                        isEditing={isEditing}
                        userEmail={userEmail}
                        formError={formError}
                    />
                </div>
            )}

            <div className="space-y-6">
                {error && addresses.length === 0 ? (
                    <div className="text-center bg-white p-6 sm:p-12 rounded-2xl">
                        <XCircle className="text-red-400 mx-auto mb-3" size={40} />
                        <p className="text-red-600 font-semibold text-lg">Failed to load addresses</p>
                        <p className="text-gray-500 mt-1 text-sm">Please check your connection and try again.</p>
                        <button
                            onClick={fetchAddresses}
                            className="mt-4 inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition"
                        >
                            Retry
                        </button>
                    </div>
                ) : addresses.length > 0 ? (
                    addresses.map(addr => (
                        <div key={addr._id} className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                                        <p className="font-bold text-base sm:text-lg text-gray-800">{addr.fullName}</p>
                                        {addr.isDefault && <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">Default</span>}
                                    </div>
                                    <p className="text-gray-600">{addr.addressLine1}</p>
                                    <p className="text-gray-600">{addr.city} - {addr.pincode}</p>
                                    {addr.landmark && <p className="text-gray-500 text-sm">Landmark: {addr.landmark}</p>}
                                    <p className="text-gray-500 text-sm mt-1">{addr.email}</p>
                                    <p className="text-gray-600 mt-2"><span className="font-semibold">Phone:</span> {addr.phoneNumber}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleEdit(addr)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={18} /></button>
                                    <button onClick={() => handleDelete(addr._id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    !showForm && (
                        <div className="text-center bg-white p-6 sm:p-12 rounded-2xl">
                            <p className="text-gray-500 text-sm sm:text-base">You have no saved addresses.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    </div>
  );
};

// A sub-component for the address form to keep things clean
const AddressForm = ({ address, onSubmit, onCancel, isEditing, userEmail, formError }) => {
    const [formData, setFormData] = useState(address);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [pincodeStatus, setPincodeStatus] = useState(null);
    const [pincodeError, setPincodeError] = useState('');
    const [deliveryData, setDeliveryData] = useState(null);

    const handlePincodeCheck = useCallback(async (pincode) => {
        if (!pincode || pincode.length !== 6) return;

        setPincodeStatus('loading');
        setPincodeError('');
        try {
            const res = await axios.get(`/api/pincodes/${pincode}`);
            setDeliveryData(res.data);
            setPincodeStatus('success');
        } catch (err) {
            setPincodeStatus('error');
            setPincodeError(err.response?.data?.message || 'Delivery not available for this location');
            setDeliveryData(null);
        }
    }, []);

    // Effect to check pincode when it changes
    useEffect(() => {
        if (formData.pincode?.length === 6) {
            const timeoutId = setTimeout(() => {
                handlePincodeCheck(formData.pincode);
            }, 500); // Debounce
            return () => clearTimeout(timeoutId);
        } else {
            setPincodeStatus(null);
            setPincodeError('');
            setDeliveryData(null);
        }
    }, [formData.pincode, handlePincodeCheck]);

    // Also check pincode on initial load if editing an existing address
    useEffect(() => {
        if (isEditing && address?.pincode?.length === 6) {
            handlePincodeCheck(address.pincode);
        }
    }, [isEditing, address?.pincode, handlePincodeCheck]);

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.fullName?.trim()) errors.fullName = 'Full name is required';
        if (!formData.addressLine1?.trim()) errors.addressLine1 = 'Address is required';
        if (!formData.city?.trim()) errors.city = 'City is required';
        if (!formData.pincode?.trim() || !/^\d{6}$/.test(formData.pincode)) errors.pincode = 'Valid 6-digit pincode is required';
        if (!formData.landmark?.trim()) errors.landmark = 'Landmark is required';
        if (!formData.phoneNumber?.trim() || !/^\d{10}$/.test(formData.phoneNumber.replace(/\D/g, ''))) errors.phoneNumber = 'Valid 10-digit phone is required';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const isPincodeBlocked = pincodeStatus === 'error' || pincodeStatus === 'loading';

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm() || isPincodeBlocked) {
            return;
        }
        setSubmitting(true);
        await onSubmit(formData);
        setSubmitting(false);
    };

    return (
        <div className="bg-white rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg border border-gray-200 w-full max-w-2xl relative my-4 sm:my-8 mx-2 sm:mx-0" onClick={(e) => e.stopPropagation()}>
            <button onClick={onCancel} className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors">
                <XCircle size={22} />
            </button>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{isEditing ? 'Edit Address' : 'Add New Address'}</h2>
            {formError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                    <XCircle className="text-red-600 shrink-0" size={18} />
                    <span className="text-red-700 text-sm font-semibold">{formError}</span>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <InputField name="fullName" label="Full Name" value={formData.fullName || ''} onChange={handleInputChange} error={formErrors.fullName} Icon={User} />
                <InputField name="email" label="Email" value={userEmail} disabled Icon={Mail} />
                <InputField name="addressLine1" label="Address" value={formData.addressLine1 || ''} onChange={handleInputChange} error={formErrors.addressLine1} Icon={Home} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <InputField name="city" label="City" value={formData.city || ''} onChange={handleInputChange} error={formErrors.city} />
                    <div>
                        <InputField name="pincode" label="Pincode" value={formData.pincode || ''} onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            handleInputChange({ target: { name: 'pincode', value: val } });
                        }} error={formErrors.pincode} maxLength={6} />
                        {pincodeStatus === 'loading' && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                <Loader2 className="animate-spin" size={16} /> Checking availability...
                            </div>
                        )}
                        {pincodeStatus === 'error' && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
                                <XCircle size={16} /> {pincodeError}
                            </div>
                        )}
                        {pincodeStatus === 'success' && deliveryData && (
                            <div className="mt-2 flex items-center gap-2 text-sm text-green-700 font-semibold">
                                <CheckCircle2 size={16} />
                                <span>Delivery Available! Est: {deliveryData.estimatedDays || '3-5'} Days</span>
                            </div>
                        )}
                    </div>
                </div>
                <InputField name="landmark" label="Landmark" value={formData.landmark || ''} onChange={handleInputChange} error={formErrors.landmark} />
                <InputField name="phoneNumber" label="Phone Number" value={formData.phoneNumber || ''} onChange={handleInputChange} error={formErrors.phoneNumber} Icon={Phone} maxLength={10} />
                <div className="flex items-center gap-2">
                    <input type="checkbox" id="isDefault" name="isDefault" checked={formData.isDefault || false} onChange={handleInputChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="isDefault" className="text-sm text-gray-700">Set as default address</label>
                </div>
                <div className="flex justify-end gap-3 sm:gap-4 pt-3 sm:pt-4">
                    <button type="button" onClick={onCancel} className="px-4 sm:px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition text-sm sm:text-base">
                        Cancel
                    </button>
                    <button type="submit" disabled={submitting || isPincodeBlocked} className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
                        {submitting ? <Loader2 className="animate-spin" size={18} /> : isPincodeBlocked ? 'Pincode Unavailable' : (isEditing ? 'Save' : 'Add')}
                    </button>
                </div>
            </form>
        </div>
    );
};

const InputField = ({ name, label, value, onChange, error, Icon, disabled, ...props }) => (
    <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">{label}{!disabled && name !== 'email' && ' *'}</label>
        <div className="relative">
            {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />}
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                disabled={disabled}
                className={`w-full py-2 border rounded-lg focus:outline-none transition ${Icon ? 'pl-9' : 'pl-3'} pr-3 ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''} ${error ? 'border-red-500 focus:border-red-600' : 'border-gray-300 focus:border-indigo-500'}`}
                {...props}
            />
        </div>
        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
);

// A simple selector component to pick one of the saved addresses (used by Checkout)
const AddressSelector = ({ onSelect, selectedId: initialSelectedId }) => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedId, setSelectedId] = useState(initialSelectedId || null);
    const navigate = useNavigate();

    const fetchAddresses = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const tokenPreview = getAuthToken() ? getAuthToken().substring(0, 20) + '...' : 'null';


            const res = await addressApi.get('/');

            setAddresses(res.data.addresses || []);
        } catch (err) {
            const status = err.response?.status;
            const serverMsg = err.response?.data?.message || err.response?.data?.error;

            if (err.code === 'ERR_NETWORK') {

            } else if (status === 401) {

            }
            setError(serverMsg || `Error fetching addresses (${status || 'network error'}).`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleSelect = (addr) => {
        setSelectedId(addr._id);
        if (onSelect) onSelect(addr);
    };

    const handleEdit = (address) => {
        navigate('/addresses', { state: { editAddress: address } });
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this address?')) {
            try {

                const res = await addressApi.delete(`/${id}`);

                setAddresses(prev => prev.filter(addr => addr._id !== id));
                if (selectedId === id) {
                    setSelectedId(null);
                    if (onSelect) onSelect(null);
                }
            } catch (err) {
                const status = err.response?.status;
                const serverMsg = err.response?.data?.message || err.response?.data?.error;

                setError(serverMsg || `Error deleting address (${status || 'network error'}).`);
            }
        }
    };

    if (loading) return <div className="p-4"><BrandLoader text="Loading addresses..." /></div>;
    if (error) return (
        <div className="p-4">
            <div className="flex items-center gap-2 text-red-600 mb-3">
                <XCircle size={20} />
                <span className="font-semibold">{error}</span>
            </div>
            <button
                onClick={fetchAddresses}
                className="text-sm font-semibold text-indigo-600 hover:underline"
            >
                Retry
            </button>
        </div>
    );

    return (
        <div className="space-y-4">
            {addresses.map(addr => (
                <div key={addr._id} className={`p-4 border rounded-lg ${selectedId === addr._id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                    <div className="flex justify-between items-start">
                        <label className="flex-1 flex items-start cursor-pointer">
                            <input
                                type="radio"
                                name="selectedAddress"
                                checked={selectedId === addr._id}
                                onChange={() => handleSelect(addr)}
                                className="mr-3 mt-1 h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                            />
                            <div>
                                <span className="font-semibold">{addr.fullName}</span>
                                <div className="text-sm text-gray-600">{addr.addressLine1}, {addr.city} - {addr.pincode}</div>
                                <div className="text-sm text-gray-600">Phone: {addr.phoneNumber}</div>
                            </div>
                        </label>
                        <div className="flex gap-1">
                            <button onClick={() => handleEdit(addr)} className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Edit size={18} /></button>
                            <button onClick={() => handleDelete(addr._id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 size={18} /></button>
                        </div>
                    </div>
                </div>
            ))}
            {addresses.length === 0 && <div className="text-gray-500">No saved addresses</div>}
        </div>
    );
};

export default Address;
export { AddressForm, AddressSelector };
