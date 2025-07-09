import React from 'react';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown } from 'feather-icons-react';

const KPICard = ({ 
  title, 
  value, 
  prefix = '', 
  suffix = '', 
  icon, 
  iconBg = 'primary',
  trend = null, // 'up', 'down', or null
  trendValue = null,
  trendText = '',
  className = '',
  decimals = 0,
  duration = 3,
  linkTo = null,
  isLoading = false
}) => {
  
  const getTrendIcon = () => {
    if (trend === 'up') {
      return <TrendingUp size={16} className="text-success" />;
    } else if (trend === 'down') {
      return <TrendingDown size={16} className="text-danger" />;
    }
    return null;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-success';
    if (trend === 'down') return 'text-danger';
    return 'text-muted';
  };

  const getIconBgClass = () => {
    switch (iconBg) {
      case 'primary': return 'bg-primary';
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'danger': return 'bg-danger';
      case 'info': return 'bg-info';
      default: return 'bg-primary';
    }
  };

  if (isLoading) {
    return (
      <div className={`dash-widget w-100 ${className}`}>
        <div className="dash-widget-skeleton">
          <div className="skeleton-icon"></div>
          <div className="skeleton-content">
            <div className="skeleton-text skeleton-text-lg"></div>
            <div className="skeleton-text skeleton-text-sm"></div>
          </div>
        </div>
      </div>
    );
  }

  const CardContent = () => (
    <div className={`dash-widget w-100 position-relative ${className}`}>
      {/* Background decoration */}
      <div className="dash-widget-bg"></div>
      
      <div className="d-flex align-items-center justify-content-between h-100">
        <div className="dash-widget-content flex-grow-1">
          {/* Main value */}
          <div className="dash-widget-value mb-2">
            <h3 className="mb-0 font-weight-bold">
              {prefix}
              <CountUp
                start={0}
                end={value || 0}
                duration={duration}
                decimals={decimals}
                separator=","
              />
              {suffix}
            </h3>
          </div>
          
          {/* Title */}
          <div className="dash-widget-title mb-2">
            <h6 className="text-muted mb-0">{title}</h6>
          </div>
          
          {/* Trend indicator */}
          {(trend || trendValue) && (
            <div className="dash-widget-trend d-flex align-items-center">
              {getTrendIcon()}
              {trendValue && (
                <span className={`ms-1 small ${getTrendColor()}`}>
                  {trend === 'up' ? '+' : trend === 'down' ? '-' : ''}{trendValue}%
                </span>
              )}
              {trendText && (
                <span className="ms-2 small text-muted">{trendText}</span>
              )}
            </div>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className="dash-widget-icon">
            <div className={`icon-wrapper ${getIconBgClass()}`}>
              {React.cloneElement(icon, { 
                size: 24, 
                className: 'text-white' 
              })}
            </div>
          </div>
        )}
      </div>
      
      {/* Hover effect */}
      <div className="dash-widget-hover"></div>
    </div>
  );

  if (linkTo) {
    return (
      <a href={linkTo} className="text-decoration-none">
        <CardContent />
      </a>
    );
  }

  return <CardContent />;
};

export default KPICard;