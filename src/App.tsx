import { useEffect, useState } from "react";
import { Board } from "./Board";
import { Drawer } from "./Drawer";
import { CreateRole } from "./CreateRole";
import { DataContext, useData } from "./data";
import { ModeSwitch } from "./ModeSwitch";
import { Logo } from "./icons";
import { Apply } from "./Apply";
import { useConvexData } from "./data/convexData";
import { useDemoData } from "./data/demoData";
import type { DataApi, Mode } from "./types";

const MODE_KEY = "callscreen.mode";

export default function App() {
  const m = location.pathname.match(/^\/apply\/([^/]+)\/?$/);
  if (m) return <Apply slug={decodeURIComponent(m[1])} />;
  return <Admin />;
}

function Admin() {
  const [mode, setMode] = useState<Mode>(() => (localStorage.getItem(MODE_KEY) === "demo" ? "demo" : "live"));
  useEffect(() => { localStorage.setItem(MODE_KEY, mode); }, [mode]);
  // Keyed on mode so switching remounts the tree with a fresh data source.
  return mode === "demo" ? <DemoShell key="demo" setMode={setMode} /> : <LiveShell key="live" setMode={setMode} />;
}

function DemoShell({ setMode }: { setMode: (m: Mode) => void }) {
  const data = useDemoData();
  return <Provider data={data} setMode={setMode} />;
}
function LiveShell({ setMode }: { setMode: (m: Mode) => void }) {
  const data = useConvexData();
  return <Provider data={data} setMode={setMode} />;
}
function Provider({ data, setMode }: { data: DataApi; setMode: (m: Mode) => void }) {
  return <DataContext.Provider value={{ data, mode: data.mode, setMode }}><Shell /></DataContext.Provider>;
}

function Shell() {
  const { data } = useData();
  const roles = data.useRoles();
  const [roleId, setRoleId] = useState<string | null>(null);
  const [view, setView] = useState<"pipeline" | "create">("pipeline");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    if (roles && roles.length && (!roleId || !roles.some((r) => r._id === roleId))) setRoleId(roles[0]._id);
  }, [roles, roleId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const role = roles?.find((r) => r._id === roleId) ?? null;

  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><Logo />Callscreen</div>
        <div className="nav-h">Roles</div>
        <nav>
          {roles?.map((r) => (
            <button key={r._id} className={"role" + (view === "pipeline" && r._id === roleId ? " active" : "")}
              onClick={() => { setRoleId(r._id); setView("pipeline"); }}>
              <span>{r.name}</span><span className="n">{r.inProgress}</span>
            </button>
          ))}
          {roles && roles.length === 0 && <div className="empty" style={{ padding: "6px 8px" }}>No roles yet</div>}
        </nav>
        <button className="role new" onClick={() => setView("create")}>
          <span>
            <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M8 3v10M3 8h10" /></svg>
            New role
          </span>
        </button>
        <div className="side-foot"><a href="#">Settings</a></div>
      </aside>

      <main>
        {view === "pipeline" && (role ? <Board role={role} onOpen={setOpenId} /> : (
          <section className="view active">
            <header className="top">
              <div><h1>{roles ? "No roles yet" : "Loading…"}</h1>{roles && <p className="sub">Create a role and the agent starts screening as applications come in.</p>}</div>
              <div className="top-actions"><ModeSwitch /></div>
            </header>
            {roles && (
              <div className="empty-main">
                <button className="btn primary" onClick={() => setView("create")}>New role</button>
                <span>or switch to Demo to see the product with sample data</span>
              </div>
            )}
          </section>
        ))}
        {view === "create" && (
          <CreateRole onCancel={() => setView("pipeline")} onCreated={(id) => { setRoleId(id); setView("pipeline"); }} />
        )}
      </main>

      <div className={"scrim" + (openId ? " open" : "")} onClick={() => setOpenId(null)} />
      <Drawer id={openId} role={role} onClose={() => setOpenId(null)} />
    </div>
  );
}
