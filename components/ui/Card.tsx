
import React from 'react';
import { CardProps } from '../../types';

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = 'bg-surface rounded-lg shadow-lg p-3';
  const combinedClasses = `${baseClasses} ${className}`;

  if (onClick) {
    return (
      <button 
        onClick={onClick} 
        className={`${combinedClasses} w-full text-left`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

export default Card;
