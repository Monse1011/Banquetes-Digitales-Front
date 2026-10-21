"use client";
import { useState } from "react";
import { ResourcesTabs } from "@/components/admin/resources/resources-tabs";
import { ResourceCatalogPanel } from "@/components/admin/resources/resource-catalog-panel";
import { HumanResourcesPanel } from "@/components/admin/resources/human-resources-panel";
import { InventoryResourcesPanel } from "@/components/admin/resources/inventory-resources-panel";
import type { ResourceTab } from "@/components/admin/resources/resource-types";

export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<ResourceTab>("human");
  return (
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
        <ResourcesTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "all" && <ResourceCatalogPanel />}
        {activeTab === "human" && <HumanResourcesPanel />}
        {activeTab === "material" && (
          <InventoryResourcesPanel key="material" kind="material" />
        )}
        {activeTab === "logistic" && (
          <InventoryResourcesPanel key="logistic" kind="logistic" />
        )}
      </section>
    </main>
  );
}
