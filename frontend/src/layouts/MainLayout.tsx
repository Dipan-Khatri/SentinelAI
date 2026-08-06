import Sidebar from "../components/Sidebar";

type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayout({
  children,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />

      <main className="min-w-0 flex-1 bg-slate-900 text-white">
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
