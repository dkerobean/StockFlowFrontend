import React, { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { Calendar, TrendingUp, DollarSign } from 'feather-icons-react';
import enhancedMongoDBDashboardService from '../../services/enhancedMongoDBDashboardService';

const SalesChart = ({ className = '' }) => {
  const [chartData, setChartData] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('1M');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const timeFilters = [
    { label: '1D', value: '1D', days: 1 },
    { label: '1W', value: '1W', days: 7 },
    { label: '1M', value: '1M', days: 30 },
    { label: '3M', value: '3M', days: 90 },
    { label: '6M', value: '6M', days: 180 },
    { label: '1Y', value: '1Y', days: 365 }
  ];

  const fetchSalesData = async (timeFilter) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const data = await enhancedMongoDBDashboardService.getSalesAnalytics(timeFilter);
      
      if (data) {
        setChartData(data);
      } else {
        throw new Error('No data received');
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data');
      // Set fallback data
      setChartData(getFallbackChartData(timeFilter));
    } finally {
      setIsLoading(false);
    }
  };

  const getFallbackChartData = (timeFilter) => {
    const days = timeFilters.find(f => f.value === timeFilter)?.days || 30;
    const salesData = [];
    const purchaseData = [];
    
    for (let i = 0; i < Math.min(days, 30); i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      salesData.push({
        x: date.toISOString().split('T')[0],
        y: Math.floor(Math.random() * 50000) + 10000
      });
      
      purchaseData.push({
        x: date.toISOString().split('T')[0],
        y: Math.floor(Math.random() * 30000) + 5000
      });
    }
    
    return {
      salesChart: salesData.reverse(),
      purchaseChart: purchaseData.reverse(),
      timeFilter
    };
  };

  useEffect(() => {
    fetchSalesData(selectedFilter);
  }, [selectedFilter]);

  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
  };

  const getChartOptions = () => {
    return {
      chart: {
        type: 'area',
        height: 350,
        zoom: {
          enabled: true
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      title: {
        text: 'Sales vs Purchases Analytics',
        align: 'left',
        style: {
          fontSize: '18px',
          fontWeight: 600,
          color: '#333'
        }
      },
      subtitle: {
        text: `Data for the last ${selectedFilter}`,
        align: 'left',
        style: {
          fontSize: '14px',
          color: '#666'
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      markers: {
        size: 0,
        hover: {
          sizeOffset: 6
        }
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            colors: '#666',
            fontSize: '12px'
          },
          formatter: function (value) {
            const date = new Date(value);
            if (selectedFilter === '1D') {
              return date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              });
            } else if (selectedFilter === '1W' || selectedFilter === '1M') {
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              });
            } else {
              return date.toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              });
            }
          }
        }
      },
      yaxis: {
        title: {
          text: 'Amount ($)',
          style: {
            color: '#666',
            fontSize: '14px'
          }
        },
        labels: {
          style: {
            colors: '#666',
            fontSize: '12px'
          },
          formatter: function (value) {
            return '$' + new Intl.NumberFormat().format(value);
          }
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        x: {
          formatter: function (value) {
            return new Date(value).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
          }
        },
        y: {
          formatter: function (value) {
            return '$' + new Intl.NumberFormat().format(value);
          }
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        floating: true,
        offsetY: -25,
        offsetX: -5
      },
      colors: ['#667eea', '#f093fb'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          inverseColors: false,
          opacityFrom: 0.5,
          opacityTo: 0,
          stops: [0, 90, 100]
        }
      }
    };
  };

  const getChartSeries = () => {
    if (!chartData) return [];
    
    return [
      {
        name: 'Sales',
        data: chartData.salesChart || []
      },
      {
        name: 'Purchases',
        data: chartData.purchaseChart || []
      }
    ];
  };

  const calculateTotalSales = () => {
    if (!chartData?.salesChart) return 0;
    return chartData.salesChart.reduce((sum, item) => sum + (item.y || 0), 0);
  };

  const calculateTotalPurchases = () => {
    if (!chartData?.purchaseChart) return 0;
    return chartData.purchaseChart.reduce((sum, item) => sum + (item.y || 0), 0);
  };

  const calculateProfitMargin = () => {
    const sales = calculateTotalSales();
    const purchases = calculateTotalPurchases();
    if (sales === 0) return 0;
    return ((sales - purchases) / sales * 100).toFixed(1);
  };

  if (isLoading) {
    return (
      <div className={`card h-100 ${className}`}>
        <div className="card-body">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card h-100 ${className}`}>
        <div className="card-body">
          <div className="alert alert-warning" role="alert">
            <strong>Warning:</strong> {error}. Showing sample data.
          </div>
          <div style={{ height: '350px' }}>
            <Chart
              options={getChartOptions()}
              series={getChartSeries()}
              type="area"
              height={350}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card h-100 ${className}`}>
      <div className="card-header bg-white border-0 pb-0">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h5 className="card-title mb-1">
              <TrendingUp size={20} className="me-2 text-primary" />
              Sales Analytics
            </h5>
            <p className="text-muted small mb-0">Track your sales performance over time</p>
          </div>
          
          {/* Time Filter Buttons */}
          <div className="btn-group" role="group">
            {timeFilters.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={`btn btn-sm ${
                  selectedFilter === filter.value 
                    ? 'btn-primary' 
                    : 'btn-outline-primary'
                }`}
                onClick={() => handleFilterChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card-body">
        {/* Summary Stats */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="d-flex align-items-center">
              <div className="icon-wrapper bg-success bg-opacity-10 rounded p-2 me-3">
                <DollarSign size={20} className="text-success" />
              </div>
              <div>
                <h6 className="mb-0 text-success">
                  ${new Intl.NumberFormat().format(calculateTotalSales())}
                </h6>
                <small className="text-muted">Total Sales</small>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="d-flex align-items-center">
              <div className="icon-wrapper bg-danger bg-opacity-10 rounded p-2 me-3">
                <DollarSign size={20} className="text-danger" />
              </div>
              <div>
                <h6 className="mb-0 text-danger">
                  ${new Intl.NumberFormat().format(calculateTotalPurchases())}
                </h6>
                <small className="text-muted">Total Purchases</small>
              </div>
            </div>
          </div>
          
          <div className="col-md-4">
            <div className="d-flex align-items-center">
              <div className="icon-wrapper bg-primary bg-opacity-10 rounded p-2 me-3">
                <TrendingUp size={20} className="text-primary" />
              </div>
              <div>
                <h6 className="mb-0 text-primary">
                  {calculateProfitMargin()}%
                </h6>
                <small className="text-muted">Profit Margin</small>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '350px' }}>
          <Chart
            options={getChartOptions()}
            series={getChartSeries()}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default SalesChart;