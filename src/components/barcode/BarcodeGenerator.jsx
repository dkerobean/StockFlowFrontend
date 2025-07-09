import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col, Card, Alert } from 'react-bootstrap';
import BarcodeDisplay from './BarcodeDisplay';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const BarcodeGenerator = ({ 
  productId, 
  productSku, 
  initialBarcode = '',
  onBarcodeGenerated,
  showControls = true,
  autoGenerate = false,
  ...props 
}) => {
  const [barcode, setBarcode] = useState(initialBarcode);
  const [format, setFormat] = useState('CODE128');
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(100);
  const [displayValue, setDisplayValue] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [barcodeImage, setBarcodeImage] = useState(null);

  const barcodeFormats = [
    { value: 'CODE128', label: 'CODE 128' },
    { value: 'CODE39', label: 'CODE 39' },
    { value: 'EAN13', label: 'EAN-13' },
    { value: 'EAN8', label: 'EAN-8' },
    { value: 'UPC', label: 'UPC' },
    { value: 'ITF14', label: 'ITF-14' }
  ];

  // Auto-generate barcode on mount if requested
  useEffect(() => {
    if (autoGenerate && productId && productSku && !initialBarcode) {
      handleAutoGenerate();
    }
  }, [autoGenerate, productId, productSku, initialBarcode]);

  const handleAutoGenerate = async () => {
    if (!productId || !productSku) {
      setError('Product ID and SKU are required for auto-generation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/barcodes/auto-generate`, {
        productId,
        sku: productSku,
        prefix: 'AUTO'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const newBarcode = response.data.data.barcode;
        setBarcode(newBarcode);
        setBarcodeImage(response.data.data);
        setSuccess('Barcode auto-generated successfully!');
        
        if (onBarcodeGenerated) {
          onBarcodeGenerated(newBarcode, response.data.data);
        }
      }
    } catch (error) {
      console.error('Auto-generation error:', error);
      setError(error.response?.data?.message || 'Failed to auto-generate barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!barcode) {
      setError('Please enter a barcode value');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/barcodes/generate`, {
        text: barcode,
        format: format,
        width: width,
        height: height,
        displayValue: displayValue
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setBarcodeImage(response.data.data);
        setSuccess('Barcode image generated successfully!');
        
        if (onBarcodeGenerated) {
          onBarcodeGenerated(barcode, response.data.data);
        }
      }
    } catch (error) {
      console.error('Image generation error:', error);
      setError(error.response?.data?.message || 'Failed to generate barcode image');
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async () => {
    if (!barcode) {
      setError('Please enter a barcode value');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/barcodes/validate`, {
        text: barcode,
        format: format
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        const isValid = response.data.data.isValid;
        if (isValid) {
          setSuccess('Barcode format is valid!');
        } else {
          setError('Barcode format is invalid for the selected format');
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      setError(error.response?.data?.message || 'Failed to validate barcode');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!barcodeImage?.url) {
      setError('No barcode image available for download');
      return;
    }

    const link = document.createElement('a');
    link.href = `${API_BASE_URL}${barcodeImage.url}`;
    link.download = barcodeImage.filename || 'barcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const canvas = document.querySelector('.barcode-display canvas');
    if (canvas) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Barcode</title>
            <style>
              body { margin: 0; padding: 20px; text-align: center; }
              img { max-width: 100%; height: auto; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <img src="${canvas.toDataURL()}" alt="Barcode" />
            <p>Barcode: ${barcode}</p>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card {...props}>
      <Card.Header>
        <h5 className="mb-0">Barcode Generator</h5>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        {showControls && (
          <Form className="mb-4">
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Barcode Value</Form.Label>
                  <Form.Control
                    type="text"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter barcode value"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Format</Form.Label>
                  <Form.Select
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    {barcodeFormats.map(fmt => (
                      <option key={fmt.value} value={fmt.value}>
                        {fmt.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Width</Form.Label>
                  <Form.Control
                    type="number"
                    value={width}
                    onChange={(e) => setWidth(Number(e.target.value))}
                    min="1"
                    max="10"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Height</Form.Label>
                  <Form.Control
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(Number(e.target.value))}
                    min="50"
                    max="300"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Display Value</Form.Label>
                  <Form.Check
                    type="switch"
                    checked={displayValue}
                    onChange={(e) => setDisplayValue(e.target.checked)}
                    label="Show text below barcode"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col>
                <Button
                  variant="primary"
                  onClick={handleAutoGenerate}
                  disabled={loading || !productId || !productSku}
                  className="me-2"
                >
                  {loading ? 'Generating...' : 'Auto Generate'}
                </Button>
                <Button
                  variant="outline-primary"
                  onClick={handleGenerateImage}
                  disabled={loading || !barcode}
                  className="me-2"
                >
                  {loading ? 'Generating...' : 'Generate Image'}
                </Button>
                <Button
                  variant="outline-secondary"
                  onClick={handleValidate}
                  disabled={loading || !barcode}
                  className="me-2"
                >
                  {loading ? 'Validating...' : 'Validate'}
                </Button>
                <Button
                  variant="outline-success"
                  onClick={handleDownload}
                  disabled={!barcodeImage?.url}
                  className="me-2"
                >
                  Download
                </Button>
                <Button
                  variant="outline-info"
                  onClick={handlePrint}
                  disabled={!barcode}
                >
                  Print
                </Button>
              </Col>
            </Row>
          </Form>
        )}

        <div className="text-center">
          <BarcodeDisplay
            value={barcode}
            format={format}
            width={width}
            height={height}
            displayValue={displayValue}
            style={{ 
              border: '1px solid #e0e0e0', 
              borderRadius: '4px', 
              padding: '20px',
              backgroundColor: '#fafafa'
            }}
          />
        </div>

        {barcodeImage && (
          <div className="mt-3">
            <small className="text-muted">
              Generated image: {barcodeImage.filename} ({barcodeImage.size} bytes)
            </small>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default BarcodeGenerator;