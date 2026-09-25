import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Silent route-reset only — mounted globally (public site + admin) so navigating to
// a new page always starts at the top. The visible "back to top" button is a
// separate component (BackToTopButton), since it's a public-site-only UI element
// that would look out of place inside the admin panel's own design system.
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export default ScrollToTop;
