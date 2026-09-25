import React from 'react';
import { Link } from 'react-router-dom';

const Button = ({
  children,
  variant = 'primary',
  to,
  onClick,
  className = '',
  type = 'button',
  icon: Icon,
  disabled = false,
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none";

  const variants = {
    primary: "bg-gradient-to-r from-primary to-teal text-white hover:shadow-lg hover:shadow-primary/25 focus:ring-primary",
    outline: "border-2 border-white text-white hover:bg-white hover:text-primary focus:ring-white",
    white: "bg-white text-primary hover:bg-bg focus:ring-white",
    teal: "bg-gradient-to-r from-teal to-light-blue text-white hover:shadow-lg hover:shadow-teal/25 focus:ring-teal"
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
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {children}
      {Icon && <Icon size={18} />}
    </button>
  );
};

export default Button;
