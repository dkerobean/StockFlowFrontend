import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

class BarcodeService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  // Get authorization headers
  getAuthHeaders() {
    return {
      headers: {
        Authorization: `Bearer ${this.token || localStorage.getItem('token')}`
      }
    };
  }

  // Generate barcode image
  async generateBarcode(text, options = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/generate`, {
        text,
        format: options.format || 'CODE128',
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate barcode');
    }
  }

  // Generate barcode as base64
  async generateBarcodeBase64(text, options = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/generate-base64`, {
        text,
        format: options.format || 'CODE128',
        width: options.width || 2,
        height: options.height || 100,
        displayValue: options.displayValue !== false
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate barcode');
    }
  }

  // Get barcode for specific product
  async getProductBarcode(productId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.format) params.append('format', options.format);
      if (options.regenerate) params.append('regenerate', 'true');
      
      const response = await axios.get(
        `${API_BASE_URL}/barcodes/product/${productId}?${params.toString()}`,
        this.getAuthHeaders()
      );
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to get product barcode');
    }
  }

  // Generate multiple barcodes
  async generateBatchBarcodes(productIds, options = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/batch`, {
        productIds,
        format: options.format || 'CODE128',
        width: options.width || 2,
        height: options.height || 100
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate batch barcodes');
    }
  }

  // Generate QR code
  async generateQRCode(text, options = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/qr-code`, {
        text,
        width: options.width || 200,
        height: options.height || 200
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate QR code');
    }
  }

  // Generate QR code as base64
  async generateQRCodeBase64(text, options = {}) {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/qr-code-base64`, {
        text,
        width: options.width || 200,
        height: options.height || 200
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate QR code');
    }
  }

  // Auto-generate barcode
  async autoGenerateBarcode(productId, sku, prefix = '') {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/auto-generate`, {
        productId,
        sku,
        prefix
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to auto-generate barcode');
    }
  }

  // Validate barcode format
  async validateBarcode(text, format = 'CODE128') {
    try {
      const response = await axios.post(`${API_BASE_URL}/barcodes/validate`, {
        text,
        format
      }, this.getAuthHeaders());
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to validate barcode');
    }
  }

  // Clean up old barcode files
  async cleanupOldBarcodes(olderThanDays = 30) {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/barcodes/cleanup?olderThanDays=${olderThanDays}`,
        this.getAuthHeaders()
      );
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cleanup barcodes');
    }
  }

  // Get barcode image URL
  getBarcodeImageUrl(filename) {
    return `${API_BASE_URL}/barcodes/${filename}`;
  }

  // Download barcode image
  downloadBarcode(filename, originalFilename) {
    const link = document.createElement('a');
    link.href = this.getBarcodeImageUrl(filename);
    link.download = originalFilename || filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Print barcode
  printBarcode(barcodeValue, imageUrl) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print Barcode</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              text-align: center; 
              font-family: Arial, sans-serif;
            }
            img { 
              max-width: 100%; 
              height: auto; 
              border: 1px solid #ccc;
              padding: 10px;
            }
            .barcode-text {
              font-size: 14px;
              font-weight: bold;
              margin-top: 10px;
            }
            @media print { 
              body { margin: 0; padding: 10px; }
              img { border: none; }
            }
          </style>
        </head>
        <body>
          <img src="${imageUrl}" alt="Barcode" />
          <div class="barcode-text">${barcodeValue}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }

  // Supported barcode formats
  getSupportedFormats() {
    return [
      { value: 'CODE128', label: 'CODE 128', description: 'Most common format' },
      { value: 'CODE39', label: 'CODE 39', description: 'Alphanumeric' },
      { value: 'EAN13', label: 'EAN-13', description: 'European Article Number' },
      { value: 'EAN8', label: 'EAN-8', description: 'Short European Article Number' },
      { value: 'UPC', label: 'UPC', description: 'Universal Product Code' },
      { value: 'ITF14', label: 'ITF-14', description: 'Interleaved 2 of 5' }
    ];
  }
}

export default new BarcodeService();