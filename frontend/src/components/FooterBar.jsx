import React, { useEffect, useState } from 'react';
import './footerbar.css';

const FooterBar = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [visitCount, setVisitCount] = useState(1);

  // Handle Light/Dark Theme Switch Executioner
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    if (!isDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    }
  };

  // Visitor Counter Implementation with strict double-increment shield
  useEffect(() => {
    // DEVELOPER RESET TOOL: 
    // Uncomment the line below once, save to wipe the storage baseline, then re-comment it!
    // localStorage.removeItem('civic_visit_count');

    const hasCountedThisSession = sessionStorage.getItem('session_counted');

    if (!hasCountedThisSession) {
      sessionStorage.setItem('session_counted', 'true');
      const totalCount = localStorage.getItem('civic_visit_count');
      if (totalCount) {
        const newCount = parseInt(totalCount, 10) + 1;
        localStorage.setItem('civic_visit_count', newCount);
        setVisitCount(newCount);
      } else {
        localStorage.setItem('civic_visit_count', 1);
        setVisitCount(1);
      }
    } else {
      const totalCount = localStorage.getItem('civic_visit_count') || 1;
      setVisitCount(parseInt(totalCount, 10));
    }
  }, []);

  return (
    <footer className="dashboard-footer-bar">
      
      {/* LEFT ASPECT: EMPTY FOR SPACING */}
      <div className="footer-left-zone">
      </div>

      {/* CENTER ASPECT: COPYRIGHT INFO */}
      <div className="footer-center-zone">
        &copy; {new Date().getFullYear()} Amith Winston Colaco. All rights reserved.
      </div>

      {/* RIGHT ASPECT: HIT VISITOR COUNTER */}
      <div className="footer-right-zone">
        <span className="visitor-badge">
          Visits: <strong className="counter-digit">{visitCount}</strong>
        </span>
      </div>

    </footer>
  );
};

export default FooterBar;