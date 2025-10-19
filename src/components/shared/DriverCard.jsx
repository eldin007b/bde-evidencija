import React from 'react';

// When archived, some components referenced a CSS module named `styles`.
// Provide a safe fallback to avoid linter/runtime `no-undef` errors.
const styles = {
	card: 'driver-card',
	headerRow: 'driver-header-row',
	icon: 'driver-icon',
	name: 'driver-name',
	tura: 'driver-tura',
	statsSection: 'driver-stats',
	statsGroup: 'driver-stats-group',
	statBox: 'driver-stat-box',
	statLabel: 'driver-stat-label',
	statValue: 'driver-stat-value',
	statSublabel: 'driver-stat-sublabel',
};

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
