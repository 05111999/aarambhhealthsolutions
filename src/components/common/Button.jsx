import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({ 
  children, 
  variant = 'primary', 
  to, 
  onClick, 
  className = '', 
  type = 'button',
  icon: Icon
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-md font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-light-blue focus:ring-primary",
    outline: "border-2 border-white text-white hover:bg-white hover:text-primary focus:ring-white",
    white: "bg-white text-primary hover:bg-bg focus:ring-white",
    teal: "bg-teal text-white hover:bg-light-blue focus:ring-teal"
  };

  const classes = `${baseStyles} ${variants[variant]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick}>
        {children}
        {Icon && <Icon size={18} />}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} onClick={onClick}>
      {children}
      {Icon && <Icon size={18} />}
    </button>
  );
};

export default Button;
