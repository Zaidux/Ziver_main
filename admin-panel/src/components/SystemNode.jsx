import React from 'react';
import { AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

const SystemNode = ({ 
  component, 
  status, 
  dependencies = [], 
  onNodeClick,
  isAffected = false 
}) => {
  const statusConfig = {
    healthy: { color: 'green', icon: CheckCircle, bg: 'bg-green-500/20', border: 'border-green-500' },
    degraded: { color: 'yellow', icon: AlertTriangle, bg: 'bg-yellow-500/20', border: 'border-yellow-500' },
    down: { color: 'red', icon: XCircle, bg: 'bg-red-500/20', border: 'border-red-500' }
  };

  const { color, icon: Icon, bg, border } = statusConfig[status] || statusConfig.down;

  return (
    <div 
      className={`
        relative p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer
        ${bg} ${border} 
        ${isAffected ? 'ring-2 ring-red-400 animate-pulse' : ''}
        hover:scale-105 hover:shadow-lg
      `}
      onClick={() => onNodeClick?.(component)}
    >
      {/* Status Indicator */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-white text-sm">{component.name}</span>
        <Icon className={`w-5 h-5 text-${color}-400`} />
      </div>

      {/* Dependencies */}
      {dependencies.length > 0 && (
        <div className="mt-2">
          <span className="text-xs text-gray-400">Depends on:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {dependencies.map(dep => (
              <span 
                key={dep} 
                className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Connection Points */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
      <div className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
      <div className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
    </div>
  );
};

export default SystemNode;