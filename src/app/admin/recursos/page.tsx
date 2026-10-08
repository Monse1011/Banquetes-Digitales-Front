"use client";

import { useMemo, useState } from "react";

import {UnifiedResourcesTable} from "@/components/admin/resources/unified-resources-table";
import { ResourceDetailModal } from "@/components/admin/resources/resource-detail-modal";

import { HumanResourceFormModal } from "@/components/admin/resources/human-resource-form-modal";
import { HumanResourcesFilters } from "@/components/admin/resources/human-resources-filters";
import { HumanResourcesTable } from "@/components/admin/resources/human-resources-table";

import { MaterialResourcesTable } from "@/components/admin/resources/materiales-resources-table";
import { MaterialResourceFormModal } from "@/components/admin/resources/material-resource-form-modal";

import { LogisticResourceFormModal } from "@/components/admin/resources/logistic-resource-form-modal";
import { LogisticResourcesTable } from "@/components/admin/resources/logistic-resources-table";


import {
  MOCK_UNIFIED_RESOURCES,
  MOCK_HUMAN_RESOURCES,
  MOCK_OPERATIVE_ROLES,
  MOCK_MATERIAL_RESOURCES,
  MOCK_LOGISTIC_RESOURCES,
} from "@/components/admin/resources/resource-mocks";


import { ResourcesTabs } from "@/components/admin/resources/resources-tabs";
import type {
  UnifiedResource,HumanResource,MaterialResourceFormValues,
  ResourceTab, HumanResourceFormValues, MaterialResource,LogisticResource, LogisticResourceFormValues,
} from "@/components/admin/resources/resource-types";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceTab>("all");

  const [resourceType, setResourceType] =
    useState<"all" | "HUMAN" | "MATERIAL" | "LOGISTIC">("all");

  const [selectedUnifiedResource, setSelectedUnifiedResource] =
  useState<UnifiedResource | null>(null);

  const [logisticResources, setLogisticResources] =
    useState<LogisticResource[]>(MOCK_LOGISTIC_RESOURCES);

  const [showLogisticModal, setShowLogisticModal] =
    useState(false);

  const [editingLogistic, setEditingLogistic] =
    useState<LogisticResource | null>(null);

  const [showHumanResourceModal, setShowHumanResourceModal] =
    useState(false);

  const [showMaterialModal, setShowMaterialModal] = useState(false);

  const [editingMaterial, setEditingMaterial] =
    useState<MaterialResource | null>(null);

  const [editingResource, setEditingResource] =
    useState<HumanResource | null>(null);

  const [humanResources, setHumanResources] =
    useState<HumanResource[]>(MOCK_HUMAN_RESOURCES);

  const [materialResources, setMaterialResources] =
    useState<MaterialResource[]>(MOCK_MATERIAL_RESOURCES);

  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<"all" | "active" | "inactive">("all");
  const [roleId, setRoleId] = useState("");

  const filteredUnifiedResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return MOCK_UNIFIED_RESOURCES.filter((resource) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        resource.name.toLowerCase().includes(normalizedSearch);

      const matchesType =
        resourceType === "all" ||
        resource.type === resourceType;

      const matchesStatus =
        status === "all" ||
        (status === "active" && resource.is_active) ||
        (status === "inactive" && !resource.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [search, resourceType, status]);

  const filteredHumanResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return humanResources.filter((resource) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        resource.name.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        status === "all" ||
        (status === "active" && resource.is_active) ||
        (status === "inactive" && !resource.is_active);

      const matchesRole =
        roleId.length === 0 ||
        resource.operative_role.id === Number(roleId);

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [humanResources, search, status, roleId]);


  const filteredMaterialResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return materialResources
      .filter((resource) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          resource.name.toLowerCase().includes(normalizedSearch);

        const matchesStatus =
          status === "all" ||
          (status === "active" && resource.is_active) ||
          (status === "inactive" && !resource.is_active);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [materialResources, search, status]);

  const filteredLogisticResources = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return logisticResources
      .filter((resource) => {
        const matchesSearch =
          normalizedSearch.length === 0 ||
          resource.name.toLowerCase().includes(normalizedSearch);

        const matchesStatus =
          status === "all" ||
          (status === "active" && resource.is_active) ||
          (status === "inactive" && !resource.is_active);

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [logisticResources, search, status]);

  function handleViewUnifiedResourceDetail(
    resource: UnifiedResource,
  ) {
    setSelectedUnifiedResource(resource);
  }


    function handleAddResource() {
        setEditingResource(null);
        setShowHumanResourceModal(true);
    }

    function handleAddMaterial() {
      setEditingMaterial(null);
      setShowMaterialModal(true);
    }

    function handleAddLogistic() {
      setEditingLogistic(null);
      setShowLogisticModal(true);
    }

    function handleEditLogistic(resource: LogisticResource) {
      setEditingLogistic(resource);
      setShowLogisticModal(true);
    }

    function handleViewLogisticDetail(resource: LogisticResource) {
      console.log("Ver recurso logístico:", resource);
    }

    function handleChangeLogisticStatus(resource: LogisticResource) {
      setLogisticResources((currentResources) =>
        currentResources.map((currentResource) =>
          currentResource.id === resource.id
            ? {
                ...currentResource,
                is_active: !currentResource.is_active,
              }
            : currentResource,
        ),
      );
    }

    function handleLogisticSubmit(
      values: LogisticResourceFormValues,
    ) {
      if (editingLogistic) {
        setLogisticResources((currentResources) =>
          currentResources.map((resource) =>
            resource.id === editingLogistic.id
              ? {
                  ...resource,
                  name: values.name,
                  quantity: values.quantity,
                  unit_cost: values.unit_cost,
                  operative_role_id:
                    values.operative_role_id ?? resource.operative_role_id,
                }
              : resource,
          ),
        );
      } else {
        const nextId =
          Math.max(
            ...logisticResources.map((resource) => resource.id),
            0,
          ) + 1;

        const newResource: LogisticResource = {
          id: nextId,
          name: values.name,
          type: "LOGISTIC",
          quantity: values.quantity,
          unit_cost: values.unit_cost,
          operative_role_id: values.operative_role_id ?? 0,
          is_active: true,
        };

        setLogisticResources((currentResources) => [
          ...currentResources,
          newResource,
        ]);
      }

      setShowLogisticModal(false);
      setEditingLogistic(null);
    }

    function handleViewMaterialDetail(resource: MaterialResource) {
      console.log("Ver material:", resource);
    }

    function handleChangeMaterialStatus(resource: MaterialResource) {
      console.log(
        resource.is_active ? "Desactivar material:" : "Reactivar material:",
        resource,
      );
    }

    function handleEditMaterial(resource: MaterialResource) {
      setEditingMaterial(resource);
      setShowMaterialModal(true);
    }

    function handleMaterialSubmit(
      values: MaterialResourceFormValues,
    ) {
      if (editingMaterial) {
        setMaterialResources((currentResources) =>
          currentResources.map((resource) =>
            resource.id === editingMaterial.id
              ? {
                  ...resource,
                  name: values.name,
                  quantity: values.quantity,
                  unit_cost: values.unit_cost,
                  operative_role_id: values.operative_role_id ?? 0,
                }
              : resource,
          ),
        );
      } else {
        const nextId =
          Math.max(
            ...materialResources.map((resource) => resource.id),
            0,
          ) + 1;

        const newResource: MaterialResource = {
          id: nextId,
          name: values.name,
          type: "MATERIAL",
          quantity: values.quantity,
          unit_cost: values.unit_cost,
          operative_role_id: values.operative_role_id ?? 0,
          is_active: true,
        };

        setMaterialResources((currentResources) => [
          ...currentResources,
          newResource,
        ]);
      }

      setShowMaterialModal(false);
      setEditingMaterial(null);
    }

  function handleViewDetail(resource: HumanResource) {
    console.log("Ver detalle:", resource);
  }

  function handleHumanResourceSubmit(
    values: HumanResourceFormValues,
    ) {
    const selectedRole = MOCK_OPERATIVE_ROLES.find(
        (role) => role.id === values.operative_role_id,
    );

    if (!selectedRole) {
        return;
    }

    if (editingResource) {
        setHumanResources((currentResources) =>
        currentResources.map((resource) =>
            resource.id === editingResource.id
            ? {
                ...resource,
                name: values.name,
                operative_role: selectedRole,
                }
            : resource,
        ),
        );
    } else {
        const nextId =
        Math.max(...humanResources.map((resource) => resource.id), 0) + 1;

        const newResource: HumanResource = {
        id: nextId,
        identifier: `RH-${String(nextId).padStart(3, "0")}`,
        name: values.name,
        operative_role: selectedRole,
        is_active: true,
        assigned_to_event: false,
        };

        setHumanResources((currentResources) => [
        ...currentResources,
        newResource,
        ]);
    }

    setShowHumanResourceModal(false);
    setEditingResource(null);
    }

  function handleEdit(resource: HumanResource) {
    setEditingResource(resource);
    setShowHumanResourceModal(true);
    }

  function handleChangeStatus(resource: HumanResource) {
    console.log(
      resource.is_active ? "Desactivar:" : "Reactivar:",
      resource,
    );
  }

  return (
      <>
    <main className="p-10">
      <section className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <h1 className="font-display text-3xl font-semibold text-[#2C1A1D]">
            Gestión de Recursos
          </h1>

          <p className="mt-1 text-sm text-[#7A5055]">
            Administra los recursos disponibles para tus eventos
          </p>
        </header>

        <ResourcesTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        {activeTab === "all" && (
          <>
            <div>
              <h2 className="font-display text-3xl font-semibold text-[#2C1A1D]">
                Consulta de Recursos
              </h2>

              <p className="mt-1 text-sm text-[#7A5055]">
                Catálogo unificado de todos los recursos registrados
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre..."
                className="min-w-[280px] flex-1 rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm outline-none placeholder:text-[#B8A0A4]"
              />

              <select
                value={resourceType}
                onChange={(event) =>
                  setResourceType(
                    event.target.value as
                      | "all"
                      | "HUMAN"
                      | "MATERIAL"
                      | "LOGISTIC",
                  )
                }
                className="w-[180px] rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm"
              >
                <option value="all">Tipo: Todos</option>
                <option value="HUMAN">Tipo: Humano</option>
                <option value="MATERIAL">Tipo: Material</option>
                <option value="LOGISTIC">Tipo: Logístico</option>
              </select>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | "all"
                      | "active"
                      | "inactive",
                  )
                }
                className="w-[180px] rounded border border-[#D4BFC2] bg-white px-4 py-2.5 text-sm"
              >
                <option value="all">Estado: Todos</option>
                <option value="active">Estado: Activo</option>
                <option value="inactive">Estado: Inactivo</option>
              </select>
            </div>

            <UnifiedResourcesTable
              resources={filteredUnifiedResources}
              onViewDetail={handleViewUnifiedResourceDetail}
            />
          </>
        )}

        {activeTab === "human" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleAddResource}
                className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)]"
              >
                + Agregar Recurso
              </button>

              <HumanResourcesFilters
                search={search}
                status={status}
                roleId={roleId}
                operativeRoles={MOCK_OPERATIVE_ROLES}
                onSearchChange={setSearch}
                onStatusChange={setStatus}
                onRoleChange={setRoleId}
              />
            </div>

            <HumanResourcesTable
              resources={filteredHumanResources}
              onViewDetail={handleViewDetail}
              onEdit={handleEdit}
              onChangeStatus={handleChangeStatus}
            />
          </>
        )}

        {activeTab === "material" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleAddMaterial}
                className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)]"
              >
                + Agregar Recurso
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-[280px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4]"
                />

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as "all" | "active" | "inactive",
                    )
                  }
                  className="w-[160px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D]"
                >
                  <option value="all">Estado: Todos</option>
                  <option value="active">Estado: Activo</option>
                  <option value="inactive">Estado: Inactivo</option>
                </select>
              </div>
            </div>

            <MaterialResourcesTable
              resources={filteredMaterialResources}
              onViewDetail={handleViewMaterialDetail}
              onEdit={handleEditMaterial}
              onChangeStatus={handleChangeMaterialStatus}
            />
          </>
        )}

        {activeTab === "logistic" && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={handleAddLogistic}
                className="rounded bg-[#6B2737] px-5 py-2.5 text-sm font-medium text-[#FDF6F0] shadow-[0_2px_12px_rgba(107,39,55,0.25)]"
              >
                + Agregar Recurso
              </button>

              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar por nombre..."
                  className="w-[280px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D] outline-none placeholder:text-[#B8A0A4]"
                />

                <select
                  value={status}
                  onChange={(event) =>
                    setStatus(
                      event.target.value as "all" | "active" | "inactive",
                    )
                  }
                  className="w-[160px] rounded border border-[#D4BFC2] bg-white px-4 py-2 text-sm text-[#2C1A1D]"
                >
                  <option value="all">Estado: Todos</option>
                  <option value="active">Estado: Activo</option>
                  <option value="inactive">Estado: Inactivo</option>
                </select>
              </div>
            </div>

            <LogisticResourcesTable
              resources={filteredLogisticResources}
              onViewDetail={handleViewLogisticDetail}
              onEdit={handleEditLogistic}
              onChangeStatus={handleChangeLogisticStatus}
            />
          </>
        )}
      </section>
        </main>

        {showHumanResourceModal && (
        <HumanResourceFormModal
            mode={editingResource ? "edit" : "create"}
            operativeRoles={MOCK_OPERATIVE_ROLES}
            initialValues={
            editingResource
                ? {
                    name: editingResource.name,
                    operative_role_id: editingResource.operative_role.id,
                }
                : undefined
            }
            onClose={() => {
            setShowHumanResourceModal(false);
            setEditingResource(null);
            }}
            onSubmit={handleHumanResourceSubmit}
        />
        )}
        {showMaterialModal && (
          <MaterialResourceFormModal
            mode={editingMaterial ? "edit" : "create"}
            operativeRoles={MOCK_OPERATIVE_ROLES}
            initialValues={
              editingMaterial
                ? {
                    name: editingMaterial.name,
                    quantity: editingMaterial.quantity,
                    unit_cost: editingMaterial.unit_cost,
                    operative_role_id: editingMaterial.operative_role_id,
                  }
                : undefined
            }
            onClose={() => {
              setShowMaterialModal(false);
              setEditingMaterial(null);
            }}
            onSubmit={handleMaterialSubmit}
          />
        )}

        {showLogisticModal && (
          <LogisticResourceFormModal
            mode={editingLogistic ? "edit" : "create"}
            operativeRoles={MOCK_OPERATIVE_ROLES}
            initialValues={
              editingLogistic
                ? {
                    name: editingLogistic.name,
                    quantity: editingLogistic.quantity,
                    unit_cost: editingLogistic.unit_cost,
                    operative_role_id: editingLogistic.operative_role_id,
                  }
                : undefined
            }
            onClose={() => {
              setShowLogisticModal(false);
              setEditingLogistic(null);
            }}
            onSubmit={handleLogisticSubmit}
          />
        )}

        {selectedUnifiedResource && (
          <ResourceDetailModal
            resource={selectedUnifiedResource}
            onClose={() => setSelectedUnifiedResource(null)}
          />
        )}
    </>
    );
}  
