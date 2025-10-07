import React from 'react';
import styles from './DriverCard.module.css';

// Lightweight placeholder DriverCard kept to avoid breaking imports.
// This renders a minimal card when the full implementation was archived.
export default function DriverCardPlaceholder({ name = 'Driver', onClick }) {
	return (
		<div className={styles.card} onClick={onClick} role="button" tabIndex={0}>
			<div className={styles.headerRow}>
				<div className={styles.icon}>🚗</div>
				<div className={styles.name}>{name}</div>
				<div className={styles.tura}>Tura</div>
			</div>
			<div className={styles.statsSection}>
				<div className={styles.statsGroup}>
					<div className={styles.statBox}>
						<div className={styles.statLabel}>Rides</div>
						<div className={styles.statValue}>—</div>
						<div className={styles.statSublabel}>today</div>
					</div>
					<div className={styles.statBox}>
						<div className={styles.statLabel}>Distance</div>
						<div className={styles.statValue}>— km</div>
						<div className={styles.statSublabel}>total</div>
					</div>
				</div>
			</div>
		</div>
	);
}
