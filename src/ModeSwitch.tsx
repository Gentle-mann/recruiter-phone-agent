import { useData } from "./data";

export function ModeSwitch() {
  const { mode, setMode } = useData();
  return (
    <>
      {mode === "demo" && <span className="mode-hint">Demo data, nothing is saved</span>}
      <div className="mode" role="group" aria-label="Data mode">
        <button className={mode === "demo" ? "on" : ""} onClick={() => setMode("demo")}>Demo</button>
        <button className={mode === "live" ? "on" : ""} onClick={() => setMode("live")}>Live</button>
      </div>
    </>
  );
}
