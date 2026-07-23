import { Link } from "react-router-dom";

function Sidebar() {
  return (
    <aside
      style={{
        width: "280px",
        height: "100vh",
        background: "#111827",
        color: "white",
        padding: "20px",
      }}
    >
      <h2>🛡 SentinelAI</h2>

      <nav style={{ marginTop: "30px" }}>
        <ul style={{ listStyle: "none", padding: 0 }}>
          <li><Link to="/">🏠 Dashboard</Link></li>
          <li><Link to="/investigations">🔍 Investigations</Link></li>
          <li><Link to="/upload">📂 Upload Logs</Link></li>
          <li><Link to="/mitre">🛡 MITRE Explorer</Link></li>
          <li><Link to="/reports">📄 Reports</Link></li>
          <li><Link to="/settings">⚙️ Settings</Link></li>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
