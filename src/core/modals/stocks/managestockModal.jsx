import React, { useState, useEffect } from "react";
import Select from "react-select";
import Image from "../../img/image";
import { Link } from "react-router-dom";
import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = process.env.REACT_APP_API_URL;

const ManageStockModal = ({
    isOpen,
    onClose,
    inventoryId,
    productName,
    currentQuantity,
    onStockUpdated
}) => {
    const [quantity, setQuantity] = useState(currentQuantity || 0);
    const [isLoading, setIsLoading] = useState(false);
    const [locations, setLocations] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState(null);

    useEffect(() => {
        if (isOpen) {
            fetchLocations();
        }
    }, [isOpen]);

    const fetchLocations = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await axios.get(`${API_URL}/locations`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const locationOptions = response.data.map(loc => ({
                value: loc._id,
                label: `${loc.name} (${loc.type || 'N/A'})`
            }));

            setLocations(locationOptions);
        } catch (error) {
            console.error('Error fetching locations:', error);
            toast.error('Failed to load locations');
        }
    };

    const handleQuantityChange = (value) => {
        const newValue = parseInt(value) || 0;
        setQuantity(newValue);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedLocation) {
            toast.error('Please select a location');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await axios.put(
                `${API_URL}/inventory/${inventoryId}`,
                {
                    quantity: quantity,
                    locationId: selectedLocation.value
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            toast.success('Stock updated successfully');
            if (onStockUpdated) {
                onStockUpdated(response.data);
            }
            onClose();
        } catch (error) {
            console.error('Error updating stock:', error);
            toast.error(error.response?.data?.message || 'Failed to update stock');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal fade show" style={{ display: 'block' }}>
            <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
                <div className="modal-content">
                    <div className="page-wrapper-new p-0">
                        <div className="content">
                            <div className="modal-header border-0 custom-modal-header">
                                <div className="page-title">
                                    <h4>Adjust Stock - {productName}</h4>
                                </div>
                                <button
                                    type="button"
                                    className="close"
                                    onClick={onClose}
                                    aria-label="Close"
                                >
                                    <span aria-hidden="true">×</span>
                                </button>
                            </div>
                            <div className="modal-body custom-modal-body">
                                <form onSubmit={handleSubmit}>
                                    <div className="row">
                                        <div className="col-lg-12">
                                            <div className="input-blocks">
                                                <label>Location</label>
                                                <Select
                                                    className="select"
                                                    options={locations}
                                                    value={selectedLocation}
                                                    onChange={setSelectedLocation}
                                                    placeholder="Select Location"
                                                />
                                            </div>
                                        </div>
                                        <div className="col-lg-12">
                                            <div className="input-blocks">
                                                <label>Quantity</label>
                                                <div className="product-quantity">
                                                    <span
                                                        className="quantity-btn"
                                                        onClick={() => handleQuantityChange(quantity - 1)}
                                                    >
                                                        <i className="feather-minus-circle" />
                                                    </span>
                                                    <input
                                                        type="number"
                                                        className="quntity-input"
                                                        value={quantity}
                                                        onChange={(e) => handleQuantityChange(e.target.value)}
                                                        min="0"
                                                    />
                                                    <span
                                                        className="quantity-btn"
                                                        onClick={() => handleQuantityChange(quantity + 1)}
                                                    >
                                                        <i className="feather-plus-circle" />
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-footer-btn">
                                        <button
                                            type="button"
                                            className="btn btn-cancel me-2"
                                            onClick={onClose}
                                            disabled={isLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn btn-submit"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Updating...' : 'Update Stock'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageStockModal;
