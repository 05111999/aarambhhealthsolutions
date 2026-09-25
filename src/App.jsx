import React, { Suspense, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import ScrollToTop from './components/layout/ScrollToTop';
import WhatsAppButton from './components/common/WhatsAppButton';
import SocialRail from './components/common/SocialRail';
import BackToTopButton from './components/common/BackToTopButton';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages that don't touch Firestore/Storage stay eager — instant load for the
// highest-traffic marketing pages.
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import Partner from './pages/Partner';
import NotFound from './pages/NotFound';

// Staff module — lazy-loaded so it never ships in the public bundle.
const AdminApp = React.lazy(() => import('./admin/AdminApp'));

// These three are the only public-facing pieces that write to Firestore (Careers also
// uploads to Storage) — lazy-loading them keeps that SDK weight out of the initial
// bundle for visitors who only browse the marketing pages.
const Careers = React.lazy(() => import('./pages/Careers'));
const Contact = React.lazy(() => import('./pages/Contact'));
const BookingModal = React.lazy(() => import('./components/common/BookingModal'));

function PublicSite() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  // Separate from isBookingModalOpen: once true, stays true for the rest of the
  // session, so the modal (and its lazy chunk) mounts on first open and then stays
  // mounted — letting its own AnimatePresence play the close animation on every
  // subsequent close, instead of getting yanked out of the tree instantly.
  const [hasOpenedBookingModal, setHasOpenedBookingModal] = useState(false);
  const location = useLocation();

  const openBookingModal = () => {
    setHasOpenedBookingModal(true);
    setIsBookingModalOpen(true);
  };
  const closeBookingModal = () => setIsBookingModalOpen(false);

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Navbar onBookClick={openBookingModal} />

      <main className="flex-grow pt-[72px]">
        {/* Keyed by path so navigating away from a broken page (via the still-visible
            Navbar) resets the boundary instead of staying stuck in the error state. */}
        <ErrorBoundary key={location.pathname}>
          <Suspense fallback={<div className="min-h-[60vh]" />}>
            <Routes>
              <Route index element={<Home onBookClick={openBookingModal} />} />
              <Route path="about" element={<About />} />
              <Route path="services" element={<Services onBookClick={openBookingModal} />} />
              <Route path="services/:slug" element={<ServiceDetail onBookClick={openBookingModal} />} />
              <Route path="partner" element={<Partner />} />
              <Route path="careers" element={<Careers />} />
              <Route path="contact" element={<Contact />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />
      <WhatsAppButton />
      <SocialRail />
      <BackToTopButton />
      {hasOpenedBookingModal && (
        <Suspense fallback={null}>
          <BookingModal isOpen={isBookingModalOpen} onClose={closeBookingModal} />
        </Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route
          path="/admin/*"
          element={
            <ErrorBoundary>
              <Suspense fallback={<div className="min-h-screen" />}>
                <AdminApp />
              </Suspense>
            </ErrorBoundary>
          }
        />
        <Route path="/*" element={<PublicSite />} />
      </Routes>
    </>
  );
}

export default App;
