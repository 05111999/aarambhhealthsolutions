import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import WhatsAppButton from './components/common/WhatsAppButton';
import BookingModal from './components/common/BookingModal';

// Pages
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Partner from './pages/Partner';
import Careers from './pages/Careers';
import Contact from './pages/Contact';

function App() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const openBookingModal = () => setIsBookingModalOpen(true);
  const closeBookingModal = () => setIsBookingModalOpen(false);

  return (
    <>
      <ScrollToTop />
      <div className="flex flex-col min-h-screen">
        <Navbar onBookClick={openBookingModal} />
        
        <main className="flex-grow pt-[72px]">
          <Routes>
            <Route path="/" element={<Home onBookClick={openBookingModal} />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services onBookClick={openBookingModal} />} />
            <Route path="/services/:slug" element={<ServiceDetail onBookClick={openBookingModal} />} />
            <Route path="/partner" element={<Partner />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />
        <WhatsAppButton />
        <BookingModal isOpen={isBookingModalOpen} onClose={closeBookingModal} />
      </div>
    </>
  );
}

export default App;
