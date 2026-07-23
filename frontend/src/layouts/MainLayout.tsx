import Sidebar from "../components/Sidebar";

type MainLayoutProps = {
  children: React.ReactNode;
};

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <main
        style={{
          flex: 1,
          padding: "30px",
          background: "#0F172A",
          color: "white",
          minHeight: "100vh",
        }}
      >
        {children}
      </main>
    </div>
  );
}

export default MainLayout;
