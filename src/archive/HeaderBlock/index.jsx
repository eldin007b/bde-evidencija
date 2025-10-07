import React from 'react';
import PropTypes from 'prop-types';
import './styles.css';

const HeaderBlock = ({
  title,
  subtitle,
  icon: Icon,
  rightContent,
  className = '',
  titleClassName = '',
  subtitleClassName = ''
}) => {
  return (
    <div className={`header-block ${className}`}>
      <div className="header-title-block">
        <div className="header-title-content">
          {Icon && (
            <div className="header-icon">
              <Icon size={32} />
            </div>
          )}
          <div>
            <h1 className={`header-title ${titleClassName}`}>{title}</h1>
            {subtitle && (
              <div className={`header-subtitle ${subtitleClassName}`}>{subtitle}</div>
            )}
          </div>
        </div>
        {rightContent && rightContent}
      </div>
    </div>
  );
};

HeaderBlock.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.elementType,
  rightContent: PropTypes.node,
  className: PropTypes.string,
  titleClassName: PropTypes.string,
  subtitleClassName: PropTypes.string
};

export default HeaderBlock;