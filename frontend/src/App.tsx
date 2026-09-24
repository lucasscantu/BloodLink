import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import BloodBags from "./pages/BloodBags";
import CreateBloodBag from "./pages/CreateBloodBag";
import BloodBagDetail from "./pages/BloodBagDetail";
import Stock from "./pages/Stock";
import Demands from "./pages/Demands";
import DemandDetail from "./pages/DemandDetail";
import Transfers from "./pages/Transfers";
import Institutions from "./pages/Institutions";
import NetworkMap from "./pages/NetworkMap";
import Audit from "./pages/Audit";
import Blockchain from "./pages/Blockchain";
import Alerts from "./pages/Alerts";
import ScanQrCode from "./pages/ScanQrCode";
import Users from "./pages/Users";
import Settings from "./pages/Settings";

function PrivateRoute({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

/**
 * Protege rotas restritas a determinados papéis (ex.: /users e /settings,
 * só para ADMIN). O backend já bloqueia essas chamadas com 403 para outros
 * papéis, mas sem essa guarda no roteamento a página renderizava mesmo
 * assim (lista vazia, formulário que sempre falhava) para quem digitasse
 * a URL diretamente — em vez de simplesmente mandar a pessoa de volta.
 */
function RoleRoute({ roles, children }: { roles: string[]; children: JSX.Element }) {
  const { user } = useAuth();
  if (!user || !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route path="/" element={<Dashboard />} />
        <Route path="/blood-bags" element={<BloodBags />} />
        <Route path="/blood-bags/new" element={<CreateBloodBag />} />
        <Route path="/scan" element={<ScanQrCode />} />
        <Route path="/blood-bags/:id" element={<BloodBagDetail />} />
        <Route path="/stock" element={<Stock />} />
        <Route path="/demands" element={<Demands />} />
        <Route path="/demands/:id" element={<DemandDetail />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/institutions" element={<Institutions />} />
        <Route path="/map" element={<NetworkMap />} />
        <Route path="/audit" element={<Audit />} />
        <Route path="/blockchain" element={<Blockchain />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/users" element={<RoleRoute roles={["ADMIN"]}><Users /></RoleRoute>} />
        <Route path="/settings" element={<RoleRoute roles={["ADMIN"]}><Settings /></RoleRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
