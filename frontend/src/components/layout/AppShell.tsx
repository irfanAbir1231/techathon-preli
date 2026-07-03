import { Outlet } from "react-router-dom";
import { useOfficeDashboard } from "../../hooks/useOfficeDashboard";
import { ErrorBanner } from "../feedback/ErrorBanner";
import { Toast } from "../feedback/Toast";
import { FooterStatusBar } from "./FooterStatusBar";
import { Header } from "./Header";
import { MobileNavigation } from "./MobileNavigation";
import { Sidebar } from "./Sidebar";

export const AppShell = () => {
  const { envError, error, retry, toast, dismissToast } = useOfficeDashboard();

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-area">
        <Header />
        {envError ? <ErrorBanner title="Frontend configuration required" message={envError} /> : null}
        {!envError && error ? <ErrorBanner message={error} onRetry={retry} /> : null}
        {!envError ? <Outlet /> : null}
        <FooterStatusBar />
      </main>
      <MobileNavigation />
      {toast ? <Toast message={toast.message} onDismiss={dismissToast} /> : null}
    </div>
  );
};
