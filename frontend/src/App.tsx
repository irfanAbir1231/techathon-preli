import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { AlertsPage } from "./pages/AlertsPage";
import { ComingSoonPage } from "./pages/ComingSoonPage";
import { DevicesPage } from "./pages/DevicesPage";
import { OverviewPage } from "./pages/OverviewPage";
import { RoomsPage } from "./pages/RoomsPage";

export const App = () => (
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<OverviewPage />} />
      <Route path="rooms" element={<RoomsPage />} />
      <Route path="devices" element={<DevicesPage />} />
      <Route path="alerts" element={<AlertsPage />} />
      <Route path="analytics" element={<ComingSoonPage title="Analytics" />} />
      <Route path="reports" element={<ComingSoonPage title="Reports" />} />
      <Route path="settings" element={<ComingSoonPage title="Settings" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
