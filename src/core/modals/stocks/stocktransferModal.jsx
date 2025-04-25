import React, { useState, useEffect } from "react";
import Select from "react-select";
import ImageWithBasePath from "../../img/imagewithbasebath";
import { Link } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_API_URL;

const StockTransferModal = ({ onTransferCreated, locations, products }) => {
  const [formData, setFormData] = useState({
    fromLocation: null,
    toLocation: null,
    selectedProduct: null,
    quantity: 1,
    notes: '',
    responsiblePerson: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [productOptions, setProductOptions] = useState([]);

  useEffect(() => {
    if (products && Array.isArray(products)) {
      const options = products.map(product => ({
        value: product._id,
        label: product.name,
        sku: product.sku,
        imageUrl: product.imageUrl
      }));
      setProductOptions(options);
    }
  }, [products]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!formData.fromLocation || !formData.toLocation || !formData.selectedProduct) {
      toast.error("Please select source location, destination location, and product");
      setIsLoading(false);
      return;
    }

    if (formData.fromLocation.value === formData.toLocation.value) {
      toast.error("Source and destination locations cannot be the same");
      setIsLoading(false);
      return;
    }

    try {
      const payload = {
        productId: formData.selectedProduct.value,
        quantity: parseInt(formData.quantity),
        fromLocationId: formData.fromLocation.value,
        toLocationId: formData.toLocation.value,
        notes: formData.notes || undefined
      };

      console.log('Creating stock transfer with payload:', payload);

      const response = await axios.post(`${API_URL}/transfers`, payload, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Transfer creation response:', response.data);
      toast.success("Stock transfer created successfully");

      if (onTransferCreated) {
        onTransferCreated();
      }

      // Close modal and reset form
      const closeButton = document.getElementById('add-units').querySelector('.close');
      if (closeButton) {
        closeButton.click();
      }

      setFormData({
        fromLocation: null,
        toLocation: null,
        selectedProduct: null,
        quantity: 1,
        notes: '',
        responsiblePerson: ''
      });
    } catch (err) {
      console.error("Error creating transfer:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Failed to create transfer");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Add Stock */}
      <div className="modal fade" id="add-units">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Add Transfer</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse From</label>
                          <Select
                            className="select"
                            options={locations}
                            value={formData.fromLocation}
                            onChange={(selected) => setFormData({...formData, fromLocation: selected})}
                            placeholder="Select Source Location"
                          />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse To</label>
                          <Select
                            className="select"
                            options={locations}
                            value={formData.toLocation}
                            onChange={(selected) => setFormData({...formData, toLocation: selected})}
                            placeholder="Select Destination Location"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks">
                          <label>Responsible Person</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.responsiblePerson}
                            onChange={(e) => setFormData({...formData, responsiblePerson: e.target.value})}
                          />
                        </div>
                      </div>
                      <div className="col-lg-8">
                        <div className="input-blocks">
                          <label>Product</label>
                          <Select
                            className="select"
                            options={productOptions}
                            value={formData.selectedProduct}
                            onChange={(selected) => setFormData({...formData, selectedProduct: selected})}
                            placeholder="Select Product"
                          />
                        </div>
                      </div>
                      <div className="col-lg-4">
                        <div className="input-blocks">
                          <label>Quantity</label>
                          <input
                            type="number"
                            className="form-control"
                            value={formData.quantity}
                            onChange={(e) => setFormData({...formData, quantity: Math.max(1, parseInt(e.target.value) || 1)})}
                            min="1"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks">
                          <label>Notes</label>
                          <textarea
                            className="form-control"
                            value={formData.notes}
                            onChange={(e) => setFormData({...formData, notes: e.target.value})}
                            rows="3"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer-btn mt-3">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-submit"
                        disabled={isLoading || !formData.fromLocation || !formData.toLocation || !formData.selectedProduct}
                      >
                        {isLoading ? 'Processing...' : 'Create Transfer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Add Stock */}
      {/* Edit Stock */}
      <div className="modal fade" id="edit-units">
        <div className="modal-dialog modal-dialog-centered stock-adjust-modal">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Edit Transfer</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="modal-body custom-modal-body">
                  <form>
                    <div className="input-blocks search-form">
                      <label>Product</label>
                      <input
                        type="text"
                        className="form-control"
                        defaultValue="Nike Jordan"
                      />
                      <i
                        data-feather="search"
                        className="feather-search custom-search"
                      />
                    </div>
                    <div className="row">
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse From</label>
                          <Select className="select" options={locations} />
                        </div>
                      </div>
                      <div className="col-lg-6">
                        <div className="input-blocks">
                          <label>Warehouse To</label>
                          <Select className="select" options={locations} />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks">
                          <label>Reference No</label>
                          <input
                            type="text"
                            className="form-control"
                            defaultValue={32434545}
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks search-form mb-3">
                          <label>Product</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Select Product"
                            defaultValue="Nike Jordan"
                          />
                          <i
                            data-feather="search"
                            className="feather-search custom-search"
                          />
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="modal-body-table">
                          <div className="table-responsive">
                            <table className="table  datanew">
                              <thead>
                                <tr>
                                  <th>Product</th>
                                  <th>SKU</th>
                                  <th>Category</th>
                                  <th>Qty</th>
                                  <th className="no-sort">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>
                                    <div className="productimgname">
                                      <Link
                                        to="#"
                                        className="product-img stock-img"
                                      >
                                        <ImageWithBasePath
                                          src="assets/img/products/stock-img-02.png"
                                          alt="product"
                                        />
                                      </Link>
                                      <Link to="#">Nike Jordan</Link>
                                    </div>
                                  </td>
                                  <td>PT002</td>
                                  <td>Nike</td>
                                  <td>
                                    <div className="product-quantity">
                                      <span className="quantity-btn">
                                        <i
                                          data-feather="minus-circle"
                                          className="feather-search"
                                        />
                                      </span>
                                      <input
                                        type="text"
                                        className="quntity-input"
                                        defaultValue={2}
                                      />
                                      <span className="quantity-btn">
                                        +
                                        <i
                                          data-feather="plus-circle"
                                          className="plus-circle"
                                        />
                                      </span>
                                    </div>
                                  </td>
                                  <td className="action-table-data">
                                    <div className="edit-delete-action">
                                      <Link
                                        className="me-2 p-2"
                                        to="#"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit-units"
                                      >
                                        <i
                                          data-feather="edit"
                                          className="feather-edit"
                                        />
                                      </Link>
                                      <Link className="confirm-text p-2" to="#">
                                        <i
                                          data-feather="trash-2"
                                          className="feather-trash-2"
                                        />
                                      </Link>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                      <div className="col-lg-12">
                        <div className="input-blocks search-form mb-0">
                          <label>Notes</label>
                          <textarea
                            className="form-control"
                            defaultValue={
                              "The Jordan brand is owned by Nike (owned by the Knight family), as, at the time, the company was building its strategy to work with athletes to launch shows that could inspire consumers.Although Jordan preferred Converse and Adidas, they simply could not match the offer Nike made. "
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Edit Stock */}
      {/* Import Transfer */}
      <div className="modal fade" id="view-notes">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="page-wrapper-new p-0">
              <div className="content">
                <div className="modal-header border-0 custom-modal-header">
                  <div className="page-title">
                    <h4>Import Transfer</h4>
                  </div>
                  <button
                    type="button"
                    className="close"
                    data-bs-dismiss="modal"
                    aria-label="Close"
                  >
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
              </div>
              <div className="modal-body custom-modal-body">
                <form>
                  <div className="row">
                    <div className="col-lg-4 col-sm-6 col-12">
                      <div className="input-blocks">
                        <label>From</label>
                        <Select
                          className="select"
                          options={locations}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-6 col-12">
                      <div className="input-blocks">
                        <label>To</label>
                        <Select
                          className="select"
                          options={locations}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4 col-sm-6 col-12">
                      <div className="input-blocks">
                        <label>Satus</label>
                        <Select
                          className="select"
                          options={["choose", "sent", "pending"]}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-12">
                      <div className="row">
                        <div>
                          <div className="modal-footer-btn download-file">
                            <Link to="#" className="btn btn-submit">
                              Download Sample File
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="input-blocks image-upload-down">
                        <label> Upload CSV File</label>
                        <div className="image-upload download">
                          <input type="file" />
                          <div className="image-uploads">
                            <ImageWithBasePath
                              src="assets/img/download-img.png"
                              alt="img"
                            />
                            <h4>
                              Drag and drop a <span>file to upload</span>
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-12 col-sm-6 col-12">
                      <div className="mb-3">
                        <label className="form-label">Shipping</label>
                        <input type="text" className="form-control" />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3 summer-description-box transfer">
                      <label className="form-label">Description</label>
                      <div id="summernote3"></div>
                      <p>Maximum 60 Characters</p>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="modal-footer-btn">
                      <button
                        type="button"
                        className="btn btn-cancel me-2"
                        data-bs-dismiss="modal"
                      >
                        Cancel
                      </button>
                      <button type="submit" className="btn btn-submit">
                        Submit
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* /Import Transfer */}
    </div>
  );
};

export default StockTransferModal;
