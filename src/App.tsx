import "./App.css";
import LoginPage from "./pages/LoginPage";
import { Routes, Route, Navigate } from "react-router-dom";
import PrivateRoute from "./security/PrivateRoute";
import MainPage from "./pages/MainPage";
import { ConfirmDialog } from "primereact/confirmdialog";
import UserPage from "./pages/UserPage";
import ChatPage from "./pages/ChatPage";
import ReportPage from "./pages/ReportPage";
import ChatConfigPage from "./pages/ChatConfigPage";
import { GlobalProvider } from "./context/GlobalContext.tsx";
import SessionExpirationManager from "./context/SessionExpirationManager.tsx";
import EnvironmentPage from "./pages/EnvironmentPage.tsx";
import TablesGroupPage from "./pages/TablesGroupPage.tsx";
import TableGroupsUserPage from "./pages/TableGroupsUserPage";
import ManageReports from "./pages/ManageReports.tsx";
import EnvironmentTablesPage from "./pages/EnvironmentTablesPage.tsx";
import EnvTableColumn from "./pages/EnvTableColumn.tsx";
import TablesGroupTableColumn from "./pages/TablesGroupTableColumn.tsx";


function App() {
  return (
    <GlobalProvider>
      <ConfirmDialog />
      <SessionExpirationManager />
      <Routes>
         {/* Rutas publicas */}
        <Route path="/login" element={<LoginPage />} />
        {/* Rutas Protegidas */}
        <Route element={<PrivateRoute />}>
          <Route path="/main" element={<MainPage />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/environments" element={<EnvironmentPage />} />
          <Route path="/tablegroups/:environmentId" element={<TablesGroupPage />} />
          <Route path="/tables-group-config/:tablesGroupId" element={<TablesGroupTableColumn />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/Reports" element={<ReportPage />} />
          <Route path="/ManageReports" element={<ManageReports />} />
          <Route path="/chat-config" element={<ChatConfigPage />} />
          <Route path="/tablegroups-user/:userId" element={<TableGroupsUserPage />} />
          <Route path="/profileconfiguration/:environmentId" element={<EnvironmentTablesPage />} />
          <Route path="/environment-config/:environmentId" element={<EnvTableColumn />} />
        </Route>

        {/* Ruta default */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </GlobalProvider>
  );
}

export default App;
