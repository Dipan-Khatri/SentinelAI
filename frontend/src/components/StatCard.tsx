type StatCardProps = {
  title: string;
  value: number;
  color: string;
};

function StatCard({ title, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-slate-800 p-5 shadow-lg">
      <p className="text-sm text-gray-400">{title}</p>

      <h2
        className="mt-2 text-3xl font-bold"
        style={{ color }}
      >
        {value}
      </h2>
    </div>
  );
}

export default StatCard;
