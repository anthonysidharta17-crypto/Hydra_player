import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_CONTROL_API;

export default function AdminPanel({ onClose }) {
  const [secret, setSecret] = useState("");
  const [logged, setLogged] = useState(false);
  const [rows, setRows] = useState([]);
  const [edits, setEdits] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const call = useCallback(
    async (path, body, key) => {
      const res = await fetch(API + path, {
        method: body ? "POST" : "GET",
        headers: {
          "content-type": "application/json",
          authorization: "Bearer " + (key ?? secret),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro " + res.status);
      return data;
    },
    [secret]
  );

  const load = useCallback(async () => {
    try {
      const data = await call("/api/admin/list");
      setRows(data.registrations || []);
    } catch (e) {
      setErr(e.message);
    }
  }, [call]);

  useEffect(() => {
    if (logged) load();
  }, [logged, load]);

  async function login() {
    setErr("");
    try {
      await call("/api/admin/list", null, secret);
      setLogged(true);
    } catch (e) {
      setErr(e.message);
    }
  }

  async function act(fn, okMsg) {
    setErr("");
    setMsg("");
    try {
      await fn();
      setMsg(okMsg);
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  const setField = (id, field, value) =>
    setEdits((s) => ({ ...s, [id]: { ...s[id], [field]: value } }));

  const box = {
    position: "fixed", inset: 0, zIndex: 9999, background: "#0d0b16",
    color: "#eae7f5", padding: 20, overflow: "auto", fontFamily: "system-ui, sans-serif",
  };
  const input = {
    padding: "8px 10px", borderRadius: 8, border: "1px solid #2a2338",
    background: "#0f0c18", color: "#eae7f5", fontSize: 14, minWidth: 0, width: "100%",
  };
  const btn = (bg) => ({
    padding: "8px 12px", borderRadius: 8, border: 0, cursor: "pointer",
    background: bg, color: "#fff", fontWeight: 600, fontSize: 13,
  });

  return (
    <div style={box}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>HYDRA · Painel de acesso</h2>
        <button style={btn("#374151")} onClick={onClose}>Fechar</button>
      </div>

      {!logged ? (
        <div style={{ marginTop: 20, maxWidth: 360 }}>
          <label style={{ fontSize: 12, color: "#9d97b5" }}>Senha do administrador</label>
          <input
            style={{ ...input, margin: "6px 0 10px" }}
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
          <button style={btn("#7c3aed")} onClick={login}>Entrar</button>
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          <button style={btn("#374151")} onClick={load}>Atualizar</button>
          {rows.length === 0 && <p style={{ color: "#9d97b5" }}>Nenhum cadastro ainda.</p>}
          {rows.map((r) => (
            <div key={r.id} style={{
              background: "#16121f", border: "1px solid #2a2338",
              borderRadius: 12, padding: 12, marginTop: 12,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <strong>{r.name}</strong>
                  <div style={{ fontSize: 12, color: "#9d97b5" }}>{r.contact}</div>
                </div>
                <span style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 99, height: "fit-content",
                  background: r.status === "active" ? "#14432a" : "#4a3a12",
                  color: r.status === "active" ? "#4ade80" : "#fbbf24",
                }}>{r.status}</span>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                <input
                  style={{ ...input, flex: 1, minWidth: 120 }}
                  placeholder="usuário"
                  defaultValue={r.username || ""}
                  onChange={(e) => setField(r.id, "u", e.target.value)}
                />
                <input
                  style={{ ...input, flex: 1, minWidth: 120 }}
                  placeholder="senha"
                  onChange={(e) => setField(r.id, "p", e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                <button style={btn("#7c3aed")} onClick={() =>
                  act(() => call("/api/admin/approve", {
                    id: r.id,
                    status: "active",
                    username: (edits[r.id]?.u ?? r.username ?? "").trim(),
                    password: (edits[r.id]?.p ?? "").trim(),
                  }), "Liberado.")
                }>Liberar</button>
                <button style={btn("#92400e")} onClick={() =>
                  act(() => call("/api/admin/approve", { id: r.id, status: "pending" }), "Bloqueado.")
                }>Bloquear</button>
                <button style={btn("#7f1d1d")} onClick={() => {
                  if (window.confirm("Apagar este cadastro?"))
                    act(() => call("/api/admin/delete", { id: r.id }), "Apagado.");
                }}>Apagar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {msg && <p style={{ color: "#4ade80" }}>{msg}</p>}
      {err && <p style={{ color: "#f87171" }}>{err}</p>}
    </div>
  );
}