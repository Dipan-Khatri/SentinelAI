import { Route, Routes } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Dashboard from "./pages/Dashboard";
import Investigations from "./pages/Investigations";
import UploadLogs from "./pages/UploadLogs";
import MitreExplorer from "./pages/MitreExplorer";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/investigations" element={<Investigations />} />
        <Route path="/upload" element={<UploadLogs />} />
        <Route path="/mitre" element={<MitreExplorer />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
