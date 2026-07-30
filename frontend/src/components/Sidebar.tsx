import {
  ClipboardList,
  Database,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Shield,
  Target,
  Upload,
} from "lucide-react";
import { NavLink } from "react-router-dom";


const navigationItems = [
  {
    name: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    end: true,
  },

  {
    name: "Case Queue",
    path: "/cases",
    icon: ClipboardList,
    end: false,
  },

  {
    name: "Investigations",
    path: "/investigations",
    icon: Search,
    end: false,
  },

  {
    name: "Upload Logs",
    path: "/upload",
    icon: Upload,
    end: false,
  },

  {
    name: "MITRE Explorer",
    path: "/mitre",
    icon: Target,
    end: false,
  },

  {
    name: "Reports",
    path: "/reports",
    icon: FileText,
    end: false,
  },

  {
    name: "History",
    path: "/history",
    icon: Database,
    end: false,
  },

  {
    name: "Settings",
    path: "/settings",
    icon: Settings,
    end: false,
  },
];


function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-[280px] shrink-0 flex-col border-r border-slate-800 bg-slate-950 px-5 py-6 text-white">
      <NavLink
        to="/"
        className="flex items-center gap-3 rounded-lg px-3 py-2"
      >
        <div className="rounded-lg bg-blue-500/15 p-2">
          <Shield className="h-6 w-6 text-blue-400" />
        </div>

        <div>
          <h1 className="text-lg font-bold">
            SentinelAI
          </h1>

          <p className="text-xs text-slate-500">
            Security Operations
          </p>
        </div>
      </NavLink>

      <nav className="mt-8">
        <p className="px-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
          Workspace
        </p>

        <ul className="mt-3 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  end={item.end}
                  className={({
                    isActive,
                  }) =>
                    [
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition",

                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-400 hover:bg-slate-900 hover:text-white",
                    ].join(" ")
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" />

                  <span>
                    {item.name}
                  </span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto rounded-xl border border-slate-800 bg-slate-900/70 p-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-green-400" />

          <p className="text-sm font-medium text-green-300">
            System Online
          </p>
        </div>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          FastAPI and SQLite persistence are
          enabled.
        </p>
      </div>
    </aside>
  );
}


export default Sidebar;
