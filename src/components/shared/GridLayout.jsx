import React from 'react';
import styles from './GridLayout.module.css';

const GridLayout = ({ children }) => (
  <div className={styles.grid}>{children}</div>
);

export default GridLayout;
