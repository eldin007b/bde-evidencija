// AppHeaderModern.jsx - 2026 Enhanced
// Archived AppHeaderModern.jsx - replaced with stub
export default null;

const menuItems = [
  {
    href: '/deliveries',
    icon: <ChartBarIcon />,
    title: 'STATISTIKA',
    desc: 'Mjesečni izvještaj',
    gradient: 'gradient-primary'
  },
  {
    href: '/drivers',
    icon: <UsersIcon />,
    title: 'VOZAČI',
    desc: 'Učinak po vozaču',
    gradient: 'gradient-warm'
  },
  {
    href: '/extrarides',
    icon: <TruckIcon />,
    title: 'SONDERFAHRT',
    desc: 'Ekstra vožnje',
    gradient: 'gradient-cool'
  },
  {
    href: '/about',
    icon: <InfoIcon />,
    title: 'About',
    desc: 'Informacije i pomoć',
    gradient: 'gradient-dark'
  }
];

// ✅ Vite-compatible: koristi import.meta.env
const ADMIN_USERS = (import.meta.env.VITE_ADMIN_USERS || 'eldin,eldin begic')
  .toLowerCase()
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

const AppHeaderModern = ({ 
  user, 
  onLogout, 
  onAdminAccess, 
  onToggleSidebar, 
  isSidebarOpen = false,
  headerRef,
  navRef
}) => {
  const navigate = useNavigate();
  const [showToast, setShowToast] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false); // 🆕 2026: Scroll state
  
  React.useEffect(() => {
    // keep internal mobile nav state in sync with parent sidebar state
    setMobileNavOpen(Boolean(isSidebarOpen));
  }, [isSidebarOpen]);

  // 🆕 2026: Scroll effect for header
  React.useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const displayName = user?.name || user?.ime || user?.username || user?.tura || 'Vozač';
  const displayPoints = user?.points || user?.username || user?.tura || '--';

  const handleBadgeClick = () => {
    const nameToCheck = (user?.name || user?.ime || user?.username || '').toLowerCase();
    const pointsToCheck = String(user?.points || user?.username || user?.tura || '');
    const isAdmin = ADMIN_USERS.includes(nameToCheck) && pointsToCheck === '8610';
    
    if (isAdmin && onAdminAccess) {
      onAdminAccess();
    } else {
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleMobileToggle = () => {
    const next = !mobileNavOpen;
    setMobileNavOpen(next);
    if (onToggleSidebar) {
      // parent accepts optional boolean to explicitly open/close sidebar
      onToggleSidebar(next);
    }
  };

  const handleNavClick = (href) => {
    navigate(href);
    setMobileNavOpen(false);
    if (onToggleSidebar) onToggleSidebar(false);
  };

  // Only apply inline styles when mobile menu is open; avoid collapsing desktop nav via inline styles
  const navInlineStyle = mobileNavOpen ? { maxHeight: '260px', opacity: 1, pointerEvents: 'auto' } : undefined;

  return (
    <header ref={headerRef} className={`${styles.headerModern} ${isScrolled ? styles.scrolled : ''} headerModern`}>
      {/* Mobile Menu Toggle */}
      <button
        className={styles.sidebarToggle}
        onClick={handleMobileToggle}
        aria-label="Toggle menu"
      >
        <div className={styles.hamburger}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      {/* Navigation Menu */}
  <nav
    ref={navRef}
    className={`${styles.navModern} ${mobileNavOpen ? styles.mobileOpen : ''} navModern ${mobileNavOpen ? 'navMobileOpen' : ''}`}
    style={navInlineStyle}
    aria-expanded={mobileNavOpen}
  >
        {menuItems.map((item, index) => (
          <button
            key={item.title}
            className={`${styles.navItem} ${styles[item.gradient]}`}
            onClick={() => handleNavClick(item.href)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <div className={styles.navText}>
              <span className={styles.navTitle}>{item.title}</span>
              <span className={styles.navDesc}>{item.desc}</span>
            </div>
          </button>
        ))}
      </nav>
      {/* User Section */}
      <div className={styles.userSectionModern}>
        {/* User Badge */}
        <div 
          className={styles.userBadgeModern}
          onClick={handleBadgeClick}
          role="button"
          tabIndex={0}
          onKeyPress={(e) => e.key === 'Enter' && handleBadgeClick()}
        >
          <div className={styles.userAvatar}>
            <span>👤</span>
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{displayName}</span>
            <span className={styles.userTour}>{displayPoints}</span>
          </div>
        </div>
        {/* Logout Button */}
        <button className={styles.logoutBtnModern} onClick={onLogout}>
          <span>🚪</span>
          <span>Odjava</span>
        </button>
        {/* Toast Notification */}
        {showToast && (
          <div className={styles.toastModern}>
            <span>👋</span>
            Pozdrav, {displayName || 'vozaču'}! Nova funkcionalnost uskoro.
          </div>
        )}
      </div>
    </header>
  );
};

// original implementation archived in src/archive/AppHeaderModern.jsx