import { useEffect, useState } from "react";
import { Download, RefreshCcw, ShieldAlert } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { AdminAccessContext } from "../useAdminAccess";

type AdminLog = {
  id: string;
  action?: string | null;
  resource_type?: string | null;
  resource_id?: string | null;
  order_id?: string | null;
  previous_status?: string | null;
  new_status?: string | null;
  metadata?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at?: string | null;
  admin_user_id?: string | null;
};

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("sv-SE");
};

const formatResource = (log: AdminLog) => {
  const parts = [log.resource_type, log.resource_id || log.order_id].filter(Boolean);
  return parts.length > 0 ? parts.join(": ") : "-";
};

export default function AdminLogs() {
  const { isAdmin, loading, error, token, apiBase, signInWithGoogle } =
    useOutletContext<AdminAccessContext>();
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [localError, setLocalError] = useState("");

  const loadLogs = async () => {
    if (!token || !isAdmin) return;
    setLoadingLogs(true);
    setLocalError("");
    try {
      const response = await fetch(`${apiBase}/api/admin/logs?limit=120`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error("Kunde inte hamta loggar.");
      }
      const data = await response.json();
      setLogs(data?.data || []);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte hamta loggar.");
    } finally {
      setLoadingLogs(false);
    }
  };

  const exportLogs = async () => {
    if (!token || !isAdmin) return;
    setExporting(true);
    setLocalError("");
    try {
      const allLogs: AdminLog[] = [];
      const limit = 200;
      let offset = 0;
      let total = Number.POSITIVE_INFINITY;
      while (offset < total) {
        const response = await fetch(`${apiBase}/api/admin/logs?limit=${limit}&offset=${offset}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error("Kunde inte exportera loggar.");
        }
        const payload = await response.json();
        const batch = payload?.data || [];
        total = typeof payload?.total === "number" ? payload.total : offset + batch.length;
        allLogs.push(...batch);
        if (batch.length < limit) break;
        offset += limit;
      }

      const headers = [
        "created_at",
        "action",
        "resource_type",
        "resource_id",
        "order_id",
        "previous_status",
        "new_status",
        "admin_user_id",
        "ip_address",
        "user_agent",
        "metadata",
      ];

      const escapeCsv = (value: string) => {
        if (value.includes('"') || value.includes(",") || value.includes("\n")) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      };

      const rows = [headers.join(",")];
      allLogs.forEach((log) => {
        const values = [
          log.created_at || "",
          log.action || "",
          log.resource_type || "",
          log.resource_id || "",
          log.order_id || "",
          log.previous_status || "",
          log.new_status || "",
          log.admin_user_id || "",
          log.ip_address || "",
          log.user_agent || "",
          log.metadata ? JSON.stringify(log.metadata) : "",
        ].map((value) => escapeCsv(String(value)));
        rows.push(values.join(","));
      });

      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `admin_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Kunde inte exportera loggar.");
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-slate-400">
        Laddar...
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-slate-200 shadow-xl">
        <div className="flex items-center gap-3 text-yellow-200">
          <ShieldAlert className="h-5 w-5" />
          <p className="text-sm uppercase tracking-[0.3em]">Adminpanel</p>
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-white">Loggar</h1>
        <p className="mt-2 text-sm text-slate-400">
          {error || "Du maste vara inloggad med ditt admin-konto."}
        </p>
        <button
          type="button"
          onClick={signInWithGoogle}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white"
        >
          Logga in
        </button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Adminpanel</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Loggar</h1>
            <p className="mt-2 text-sm text-slate-400">
              Senaste admin-handelser for lager, produkter och orderstatus.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportLogs}
              className="inline-flex items-center gap-2 rounded-lg bg-yellow-400 px-4 py-2 text-xs font-semibold text-slate-900 hover:bg-[#11667b] hover:text-white"
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? "Exporterar..." : "Exportera CSV"}
            </button>
            <button
              type="button"
              onClick={loadLogs}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#11667b] hover:text-[#11667b]"
            >
              <RefreshCcw className="h-4 w-4" />
              {loadingLogs ? "Uppdaterar..." : "Uppdatera"}
            </button>
          </div>
        </div>
        {localError && <p className="mt-4 text-sm text-red-400">{localError}</p>}
      </div>

      <div className="space-y-4">
        {logs.length === 0 && !loadingLogs ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-400">
            Inga loggar hittades an.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-200 shadow-lg"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {formatDate(log.created_at)}
                </div>
                <div className="text-xs text-slate-400">{log.admin_user_id || "-"}</div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Action</p>
                  <p className="mt-1 text-sm font-semibold text-white">{log.action || "-"}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Resurs</p>
                  <p className="mt-1 text-sm text-slate-200">{formatResource(log)}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Status</p>
                  <p className="mt-1 text-sm text-slate-200">
                    {log.previous_status || "-"} {log.new_status ? `-> ${log.new_status}` : ""}
                  </p>
                </div>
              </div>
              <div className="mt-3 text-xs text-slate-400">
                IP: {log.ip_address || "-"} | UA: {log.user_agent || "-"}
              </div>
              {log.metadata && (
                <pre className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
{JSON.stringify(log.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))
        )}
      </div>
    </section>
  );
}
