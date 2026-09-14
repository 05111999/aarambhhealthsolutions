import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button';

const Navbar = ({ onBookClick }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Services', path: '/services' },
    { name: 'Partner With Us', path: '/partner' },
    { name: 'Careers', path: '/careers' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? 'pt-1 pb-1'
          : 'pt-2 pb-2'
      }`}
    >
      <div
        className={`mx-auto max-w-7xl transition-all duration-500 ${
          isScrolled
            ? 'mx-4 lg:mx-auto bg-white/95 backdrop-blur-xl shadow-lg shadow-primary/5 rounded-2xl px-6'
            : 'px-6 bg-white/80 backdrop-blur-md rounded-none'
        }`}
      >
        <div className="flex justify-between items-center py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-teal rounded-xl blur-sm opacity-40 group-hover:opacity-60 transition-opacity" />
              <div className="relative bg-gradient-to-br from-primary to-teal p-2.5 rounded-xl">
                <Heart size={22} className="text-white fill-white/30" />
              </div>
            </div>
            <div>
              <h1 className="text-[22px] font-bold leading-none text-text-dark m-0 p-0 tracking-tight">
                A<span className="text-primary">Arambh</span>
              </h1>
              <span className="text-[9px] text-text-muted uppercase tracking-[0.2em] font-medium block mt-0.5">
                Rehabilitation Care
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative px-4 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/5'
                      : 'text-text-muted hover:text-text-dark hover:bg-bg'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="navIndicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-gradient-to-r from-primary to-teal rounded-full"
                      transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            <div className="ml-4 pl-4 border-l border-border">
              <Button onClick={onBookClick} variant="primary" className="!py-2.5 !px-5 !text-[13px] !rounded-xl">
                Book Consultation
              </Button>
            </div>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="lg:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-bg hover:bg-primary/5 transition-colors"
            onClick={toggleMenu}
            aria-label="Toggle Menu"
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <X size={22} className="text-text-dark" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Menu size={22} className="text-text-dark" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="lg:hidden mx-4 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-primary/10 border border-border/50 overflow-hidden"
          >
            <div className="p-4 flex flex-col gap-1">
              {navLinks.map((link, index) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    to={link.path}
                    className={`flex items-center px-4 py-3 rounded-xl text-[15px] font-medium transition-all ${
                      location.pathname === link.path
                        ? 'text-primary bg-primary/5'
                        : 'text-text-dark hover:bg-bg'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-2 pt-3 border-t border-border/50"
              >
                <Button onClick={onBookClick} variant="primary" className="w-full !rounded-xl">
                  Book Consultation
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
