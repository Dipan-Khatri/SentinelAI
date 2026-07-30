import {
  Route,
  Routes,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";
import CaseQueue from "./pages/CaseQueue";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Investigations from "./pages/Investigations";
import MitreExplorer from "./pages/MitreExplorer";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UploadLogs from "./pages/UploadLogs";


function App() {
  return (
    <MainLayout>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/cases"
          element={<CaseQueue />}
        />

        <Route
          path="/investigations"
          element={<Investigations />}
        />

        <Route
          path="/upload"
          element={<UploadLogs />}
        />

        <Route
          path="/mitre"
          element={<MitreExplorer />}
        />

        <Route
          path="/reports"
          element={<Reports />}
        />

        <Route
          path="/history"
          element={<History />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />
      </Routes>
    </MainLayout>
  );
}


export default App;
