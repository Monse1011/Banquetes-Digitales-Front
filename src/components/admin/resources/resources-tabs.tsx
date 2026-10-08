import type { ResourceTab } from "./resource-types";

type ResourcesTabsProps = {
  activeTab: ResourceTab;
  onChange: (tab: ResourceTab) => void;
};

const tabs = [
  { id: "all", label: "Todos los Recursos" },
  { id: "human", label: "Recursos Humanos" },
  { id: "material", label: "Recursos Materiales" },
  { id: "logistic", label: "Recursos Logísticos" },
] as const;



export function ResourcesTabs({
  activeTab,
  onChange,
}: ResourcesTabsProps) {
  return (
    <div className="flex gap-6 border-b border-[#E8D8DB]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`border-b-2 pb-3 text-sm font-medium ${
              isActive
                ? "border-[#6B2737] text-[#6B2737]"
                : "border-transparent text-[#7A5055]"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}