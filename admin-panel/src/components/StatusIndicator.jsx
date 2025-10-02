import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, MinusCircle, TrendingUp } from 'lucide-react';

const StatusIndicator = ({ 
  status, 
  size = 'medium', 
  showLabel = false,
  propagationLevel = 0 
}) => {
  const sizeClasses = {
    small: 'w-3 h-3',
    medium: 'w-4 h-4',
    large: 'w-6 h-6'
  };

  const statusConfig = {
    healthy: { 
      color: 'text-green-400', 
      bg: 'bg-green-400',
      icon: CheckCircle,
      label: 'Healthy'
    },
    degraded: { 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-400',
      icon: AlertTriangle,
      label: 'Degraded'
    },
    down: { 
      color: 'text-red-400', 
      bg: 'bg-red-400',
      icon: XCircle,
      label: 'Down'
    }
  };

  const { color, bg, icon: Icon, label } = statusConfig[status] || statusConfig.down;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        {/* Propagation Rings */}
        {propagationLevel > 0 && (
          <div className="absolute inset-0">
            {[...Array(propagationLevel)].map((_, i) => (
              <div
                key={i}
                className={`absolute rounded-full border-2 ${color} opacity-${20 - (i * 5)}`}
                style={{
                  width: `${sizeClasses[size] === 'w-3 h-3' ? 12 + (i * 6) : 
                          sizeClasses[size] === 'w-4 h-4' ? 16 + (i * 8) : 
                          24 + (i * 12)}px`,
                  height: `${sizeClasses[size] === 'w-3 h-3' ? 12 + (i * 6) : 
                           sizeClasses[size] === 'w-4 h-4' ? 16 + (i * 8) : 
                           24 + (i * 12)}px`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  animation: `pulse 2s infinite ${i * 0.3}s`
                }}
              />
            ))}
          </div>
        )}
        
        <Icon className={`${sizeClasses[size]} ${color} relative z-10`} />
      </div>
      
      {showLabel && (
        <div className="flex items-center gap-1">
          <span className={`text-sm font-medium ${color}`}>{label}</span>
          {propagationLevel > 0 && (
            <TrendingUp className="w-3 h-3 text-orange-400" />
          )}
        </div>
      )}
    </div>
  );
};

export default StatusIndicator;