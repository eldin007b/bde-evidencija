
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext.jsx';
import { DriversProvider } from './context/DriversContext.jsx';
import { SyncProvider } from './context/SyncContext.jsx';
import { LocalizationProvider } from './context/LocalizationContext/index.jsx';
import useSyncTables from './hooks/useSyncTables.js';
import DeliveriesScreen from './screens/DeliveriesScreen.jsx';
import DriversScreen from './screens/DriversScreen.jsx';
import ExtraRidesScreen from './screens/ExtraRidesScreen.jsx';
import AdminPanelScreen from './screens/AdminPanelScreen.jsx';
import AdminPanel from './screens/AdminPanel.jsx';
import AboutScreen from './screens/AboutScreenModern.jsx';
import InitScreen from './screens/InitScreen.jsx';
import modernAuthService from './utils/modernAuthService.js';
import HomeScreenModern from './screens/HomeScreenModern.jsx';


// Component to initialize table sync
function AppSyncInitializer({ children }) {
	// Initialize sync tables on app start
	useSyncTables();
	return children;
}

export default function App() {
	const [appReady, setAppReady] = useState(false);
	const [showInit, setShowInit] = useState(false);

	useEffect(() => {
		// GitHub Pages SPA redirect handling
		const query = window.location.search;
		if (query.startsWith('?p=')) {
			const redirectPath = query.slice(3);
			window.history.replaceState(null, null, redirectPath);
		}

		// Provjeri ako smo na root putanji GitHub Pages-a
		const currentPath = window.location.pathname;
		if (currentPath === '/bde-evidencija' || currentPath === '/bde-evidencija/') {
			// Ako nema hash ili query string, preusmjeri na home
			if (!window.location.hash && !window.location.search) {
				window.history.replaceState(null, null, '/bde-evidencija/');
			}
		}

		// Inicijalizacija (npr. localStorage, sync)
		const driverTura = localStorage.getItem('DRIVER_TURA');
		const lang = localStorage.getItem('APP_LANG');
		const deviceId = localStorage.getItem('DEVICE_ID');
		if (!driverTura || !lang || !deviceId) {
			setShowInit(true);
		}
		// Ovdje možeš dodati sync logiku
		setAppReady(true);

		// Activity heartbeat - ažuriraj aktivnost kad se app učita
		modernAuthService.updateActivity();

		// Page Visibility API - ažuriraj kad korisnik vrati fokus na tab
		const handleVisibilityChange = () => {
			if (!document.hidden) {
				modernAuthService.updateActivity();
			}
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);

		// Periodično ažuriranje svakih 10 minuta
		const activityInterval = setInterval(() => {
			if (!document.hidden) {
				modernAuthService.updateActivity();
			}
		}, 10 * 60 * 1000); // 10 minuta

		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			clearInterval(activityInterval);
		};
	}, []);

	if (!appReady) {
		return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;
	}

	if (showInit) {
		return (
			<LocalizationProvider>
				<UserProvider forceShowInit={() => setShowInit(true)}>
					<InitScreen onFinish={() => setShowInit(false)} />
				</UserProvider>
			</LocalizationProvider>
		);
	}

	return (
		<LocalizationProvider>
			<SyncProvider>
				<UserProvider forceShowInit={() => setShowInit(true)}>
					<DriversProvider>
						<AppSyncInitializer>
							<Router basename="/bde-evidencija">
								<Routes>
									<Route path="/" element={<HomeScreenModern />} />
									<Route path="/deliveries" element={<DeliveriesScreen />} />
									<Route path="/drivers" element={<DriversScreen />} />
									<Route path="/extrarides" element={<ExtraRidesScreen />} />
									<Route path="/admin" element={<AdminPanelScreen />} />
									<Route path="/admin-panel" element={<AdminPanelScreen />} />
									<Route path="/admin-old" element={<AdminPanel />} />
									<Route path="/about" element={<AboutScreen />} />
									<Route path="*" element={<Navigate to="/" />} />
								</Routes>
							</Router>
						</AppSyncInitializer>
					</DriversProvider>
				</UserProvider>
			</SyncProvider>
		</LocalizationProvider>
	);
}
