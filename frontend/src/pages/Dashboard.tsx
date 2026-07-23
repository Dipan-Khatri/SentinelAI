import StatCard from "../components/StatCard";

function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">

      <h1 className="text-4xl font-bold">
        Good Morning, Dipan 👋
      </h1>

      <p className="mt-2 text-gray-400">
        SentinelAI analyzed 18,423 security events overnight.
      </p>

      <div className="grid grid-cols-4 gap-5 mt-8">

        <StatCard
          title="Critical"
          value={2}
          color="#ef4444"
        />

        <StatCard
          title="High"
          value={5}
          color="#f97316"
        />

        <StatCard
          title="Medium"
          value={14}
          color="#eab308"
        />

        <StatCard
          title="Low"
          value={43}
          color="#22c55e"
        />

      </div>

      <div className="mt-10 rounded-xl bg-slate-800 p-6">

        <h2 className="text-2xl font-semibold">
          Today's Recommendation
        </h2>

        <h3 className="mt-4 text-xl font-bold">
          Credential Compromise
        </h3>

        <p className="mt-3 text-gray-300">
          Confidence: 92%
        </p>

        <p className="text-gray-300">
          MITRE: T1110 - Brute Force
        </p>

        <button className="mt-6 rounded-lg bg-blue-600 px-5 py-3 hover:bg-blue-700">
          Start Investigation
        </button>

      </div>

    </div>
  );
}

export default Dashboard;
