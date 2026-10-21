"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { getCatalogResource, listOperativeRoles, listResourceCatalog, type CatalogResource } from "@/lib/api/human-resources";
import { UnifiedResourcesTable } from "./unified-resources-table";
import { ResourceDetailModal } from "./resource-detail-modal";
import type { OperativeRoleOption, UnifiedResource } from "./resource-types";

export function ResourceCatalogPanel() {
  const {user} = useAuth();
  const [rows,setRows]=useState<CatalogResource[]>([]);
  const [roles,setRoles]=useState<OperativeRoleOption[]>([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [search,setSearch]=useState("");
  const [status,setStatus]=useState("active");
  const [type,setType]=useState("");
  const [revision,setRevision]=useState(0);
  const [detail,setDetail]=useState<UnifiedResource|null>(null);
  const [opening,setOpening]=useState(false);
  useEffect(()=>{
    if(user?.role !== "admin") return;
    const controller=new AbortController();
    // Synchronize the loading state with the remote catalog refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);setError("");
    Promise.all([listResourceCatalog("active",controller.signal),listResourceCatalog("inactive",controller.signal),listOperativeRoles(controller.signal)])
      .then(([active,inactive,catalog])=>{if(!controller.signal.aborted){setRows([...active,...inactive]);setRoles(catalog);}})
      .catch(e=>{if(!controller.signal.aborted)setError(e.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[user?.role,revision]);
  function map(row:CatalogResource):UnifiedResource {
    return {...row,identifier:String(row.id),operative_role_name:roles.find(r=>r.id===row.operative_role_id)?.name ?? (row.operative_role_id ? `Rol ${row.operative_role_id} (fuera del catálogo activo)` : undefined)};
  }
  async function inspect(row:UnifiedResource){
    if(opening)return;setOpening(true);setError("");
    try{setDetail(map(await getCatalogResource(row)));}catch(e){setError(e instanceof Error?e.message:"No fue posible consultar el recurso.");}finally{setOpening(false);}
  }
  if(user?.role !== "admin")return <p>Se requiere una sesión de Administrador General.</p>;
  return <>
    <div className="flex flex-wrap gap-3">
      <input aria-label="Buscar recurso" placeholder="Buscar por nombre…" value={search} onChange={e=>setSearch(e.target.value)} className="rounded border p-2" />
      <select aria-label="Tipo de recurso" value={type} onChange={e=>setType(e.target.value)} className="rounded border p-2"><option value="">Todos los tipos</option><option value="HUMAN">Humano</option><option value="MATERIAL">Material</option><option value="LOGISTIC">Logístico</option></select>
      <select aria-label="Estado" value={status} onChange={e=>setStatus(e.target.value)} className="rounded border p-2"><option value="active">Activos</option><option value="inactive">Inactivos</option><option value="all">Todos</option></select>
      <button disabled={loading} onClick={()=>setRevision(r=>r+1)} className="rounded border p-2">Actualizar</button>
    </div>
    {error&&<p role="alert" className="text-red-700">{error}</p>}
    {loading?<p>Cargando recursos…</p>:!error&&<UnifiedResourcesTable resources={rows.filter(r=>(!type||r.type===type)&&(status==="all"||r.is_active===(status==="active"))&&r.name.toLowerCase().includes(search.trim().toLowerCase())).sort((a,b)=>a.name.localeCompare(b.name,"es")).map(map)} onViewDetail={r=>void inspect(r)} />}
    {detail&&<ResourceDetailModal resource={detail} onClose={()=>setDetail(null)} />}
  </>;
}
