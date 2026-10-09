import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  RefreshCw,
  Activity,
  ShieldCheck,
  HardDrive,
  Cpu,
  Archive,
  Download,
  CheckCircle,
  AlertTriangle,
  Server,
  Database,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { FounderModuleHeader } from "./FounderModuleHeader";

export function ProjectDossierModule() {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("");

  const utils = trpc.useUtils();
  
  // Call the audit list API. The schema mandates page and literal 10 for pageSize.
  const auditQuery = trpc.audit.list.useQuery(
    {
      page,
      query: query || undefined,
      actorRole: roleFilter ? (roleFilter as any) : undefined,
    },
    {
      placeholderData: (prev) => prev,
      retry: false,
    }
  );

  const pageCount = auditQuery.data ? Math.ceil(auditQuery.data.total / auditQuery.data.pageSize) : 0;

  const archiveMutation = trpc.audit.archive.useMutation({
    onSuccess: () => {
      utils.audit.list.invalidate();
      toast.success("Expired audit logs archived successfully.");
    },
    onError: (err) => toast.error(err.message || "Failed to archive logs."),
  });

  const handleArchive = () => {
    archiveMutation.mutate();
  };

  const systemMetrics = [
    {
      name: "Gateway API Ingress",
      status: "Operational",
      icon: <Server className="text-emerald-500" size={18} />,
      color: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300",
    },
    {
      name: "Relational MySQL DB",
      status: "Connected (Drizzle ORM)",
      icon: <Database className="text-blue-500" size={18} />,
      color: "text-blue-700 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-300",
    },
    {
      name: "Offline Storage Sync",
      status: "Ready (LocalUserData)",
      icon: <HardDrive className="text-purple-500" size={18} />,
      color: "text-purple-700 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-300",
    },
    {
      name: "IELTS AI Evaluation Node",
      status: "Idle / Active",
      icon: <Cpu className="text-amber-500" size={18} />,
      color: "text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      <FounderModuleHeader
        title="Project Operations Dossier"
        description="Monitor systemic audit trails, operational metrics, and backup system archive logs."
        badgeLabel="Audit"
      />

      {/* System Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemMetrics.map((m, idx) => (
          <Card key={idx} className="border-slate-200/80 dark:border-slate-800/80">
            <CardContent className="p-4 flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
                {m.icon}
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{m.name}</p>
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${m.color}`}>
                  {m.status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900/60 p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60">
        <div className="flex flex-col sm:flex-row gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              placeholder="Search audit trail by activity or target..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(0);
              }}
              className="pl-9 h-11 border-slate-200 focus-visible:ring-blue-600 dark:border-slate-800"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(0);
            }}
            className="h-11 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:bg-slate-950 dark:border-slate-800"
          >
            <option value="">All Roles</option>
            <option value="founder">Founder</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleArchive}
            disabled={archiveMutation.isPending}
            variant="outline"
            className="h-11 border-slate-200 dark:border-slate-800 text-xs flex items-center gap-1.5"
          >
            <Archive size={14} />
            <span>Archive Logs</span>
          </Button>
          <Button
            onClick={() => auditQuery.refetch()}
            variant="outline"
            className="h-11 border-slate-200 dark:border-slate-800 text-xs flex items-center gap-1.5"
            disabled={auditQuery.isFetching}
          >
            <RefreshCw size={14} className={auditQuery.isFetching ? "animate-spin" : ""} />
            <span>Sync</span>
          </Button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <Card className="border-slate-200/80 dark:border-slate-800/80 shadow-xs overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-slate-800 p-5">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <ShieldCheck className="text-blue-600 dark:text-blue-500" size={18} />
            <span>Security & Administration Logs</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {auditQuery.isLoading ? (
            <div className="text-center py-20">
              <RefreshCw size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-slate-500 font-medium text-xs">Loading operational dossier...</p>
            </div>
          ) : !auditQuery.data?.rows || auditQuery.data.rows.length === 0 ? (
            <div className="text-center py-20">
              <Activity size={28} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500 font-medium text-sm">No operational audit logs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200/60 dark:border-slate-800/60 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Actor / Role</th>
                    <th className="px-5 py-3">Action</th>
                    <th className="px-5 py-3">Target</th>
                    <th className="px-5 py-3">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {auditQuery.data.rows.map((log: any) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-slate-400 font-medium flex items-center gap-1.5">
                        <Calendar size={12} />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div>
                          <p className="font-bold text-slate-800 dark:text-slate-200 text-xs truncate max-w-[150px]">{log.actorEmail || "System Event"}</p>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">{log.actorRole}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs font-bold text-slate-700 dark:text-slate-300">
                        {log.action}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-slate-500 max-w-[200px] truncate">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">{log.targetType}</span>
                        {log.targetId && ` (ID: ${log.targetId})`}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {log.isSuccess ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-100 text-[10px] px-1.5 py-0.5 rounded-sm">Success</Badge>
                        ) : (
                          <Badge className="bg-red-50 text-red-700 hover:bg-red-50 border border-red-100 text-[10px] px-1.5 py-0.5 rounded-sm">Failed</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {auditQuery.data && pageCount > 1 && (
            <div className="flex items-center justify-between px-5 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200/60 dark:border-slate-800/60">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {pageCount} ({auditQuery.data.total} events)
              </span>
              <div className="flex gap-2">
                <Button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={page >= pageCount - 1}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs border-slate-200"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ProjectDossierModule;
