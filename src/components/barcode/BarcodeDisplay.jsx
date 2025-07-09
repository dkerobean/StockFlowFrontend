import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';

const BarcodeDisplay = ({ 
  value, 
  format = 'CODE128', 
  width = 2, 
  height = 100, 
  displayValue = true,
  fontSize = 14,
  textMargin = 5,
  margin = 10,
  background = '#ffffff',
  lineColor = '#000000',
  type = 'barcode', // 'barcode' or 'qr'
  style = {},
  className = '',
  ...props 
}) => {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    if (!value) return;

    const canvas = canvasRef.current;
    const svg = svgRef.current;

    try {
      if (type === 'qr') {
        // Generate QR Code
        if (canvas) {
          QRCode.toCanvas(canvas, value, {
            width: width * 50,
            height: height,
            margin: margin / 10,
            color: {
              dark: lineColor,
              light: background
            }
          }, (error) => {
            if (error) console.error('QR Code generation error:', error);
          });
        }
      } else {
        // Generate Barcode
        const options = {
          format: format,
          width: width,
          height: height,
          displayValue: displayValue,
          fontSize: fontSize,
          textMargin: textMargin,
          margin: margin,
          background: background,
          lineColor: lineColor
        };

        if (canvas) {
          JsBarcode(canvas, value, options);
        }
        
        if (svg) {
          JsBarcode(svg, value, options);
        }
      }
    } catch (error) {
      console.error('Barcode generation error:', error);
    }
  }, [value, format, width, height, displayValue, fontSize, textMargin, margin, background, lineColor, type]);

  if (!value) {
    return (
      <div className={`barcode-display-placeholder ${className}`} style={{ 
        padding: '20px', 
        textAlign: 'center', 
        color: '#666',
        border: '1px dashed #ccc',
        borderRadius: '4px',
        ...style 
      }}>
        {type === 'qr' ? 'QR Code will appear here' : 'Barcode will appear here'}
      </div>
    );
  }

  return (
    <div className={`barcode-display ${className}`} style={style} {...props}>
      <canvas
        ref={canvasRef}
        style={{ 
          display: 'block', 
          maxWidth: '100%', 
          height: 'auto' 
        }}
      />
      <svg
        ref={svgRef}
        style={{ 
          display: 'none' 
        }}
      />
    </div>
  );
};

export default BarcodeDisplay;