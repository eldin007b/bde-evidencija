import React from 'react';
import PropTypes from 'prop-types';
import './styles.css';

const PageLayout = ({ 
  children, 
  backgroundColor, // Optional custom background gradient
  maxWidth, // Optional custom max width
}) => {
  const mainContentStyle = {
    ...(maxWidth && { maxWidth })
  };

  const backgroundStyle = backgroundColor ? {
    background: backgroundColor
  } : {};

  return (
    <div className="page-bg-gradient" style={backgroundStyle}>
      <div className="page-main-content" style={mainContentStyle}>
        {children}
      </div>
    </div>
  );
};

PageLayout.propTypes = {
  children: PropTypes.node.isRequired,
  backgroundColor: PropTypes.string,
  maxWidth: PropTypes.string
};

export default PageLayout;