import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { Board } from "./Board";
import { Drawer } from "./Drawer";
import { CreateRole } from "./CreateRole";

export default function App() {
  const roles = useQuery(api.roles.list);
  const [roleId, setRoleId] = useState<Id<"roles"> | null>(null);
  const [view, setView] = useState<"pipeline" | "create">("pipeline");
  const [openId, setOpenId] = useState<Id<"candidates"> | null>(null);

  useEffect(() => {
    if (!roleId && roles && roles.length) setRoleId(roles[0]._id);
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
        <div className="brand"><i />Callscreen</div>
        <div className="nav-h">Roles</div>
        <nav>
          {roles?.map((r) => (
            <button key={r._id} className={"role" + (view === "pipeline" && r._id === roleId ? " active" : "")}
              onClick={() => { setRoleId(r._id); setView("pipeline"); }}>
              <span>{r.name}</span><span className="n">{r.inProgress}</span>
            </button>
          ))}
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
        {view === "pipeline" && (role ? <Board role={role} onOpen={setOpenId} /> : <div className="loading">Loading roles…</div>)}
        {view === "create" && (
          <CreateRole onCancel={() => setView("pipeline")} onCreated={(id) => { setRoleId(id); setView("pipeline"); }} />
        )}
      </main>

      <div className={"scrim" + (openId ? " open" : "")} onClick={() => setOpenId(null)} />
      <Drawer id={openId} role={role} onClose={() => setOpenId(null)} />
    </div>
  );
}
