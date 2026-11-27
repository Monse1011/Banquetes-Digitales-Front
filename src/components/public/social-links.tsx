"use client";

import { Icon } from "@/components/ui/icon";
import { getSocialLinks } from "@/lib/api/client";
import { useQuery } from "@/lib/hooks";
import { SECTION_ERROR_MESSAGE } from "./section-state";

const NETWORKS: Record<string, { label: string; icon: string }> = {
  FACEBOOK: { label: "Facebook", icon: "facebook" },
  INSTAGRAM: { label: "Instagram", icon: "instagram" },
};

/** Iconos de redes sociales oficiales; solo se muestran las que tienen enlace registrado (RF-3.4.1.3). */
export function SocialLinks() {
  const { data, error } = useQuery(getSocialLinks, "social-links");

  if (error) return <p className="text-xs text-white/60">{SECTION_ERROR_MESSAGE}</p>;

  const links = (data ?? []).filter((link) => NETWORKS[link.network?.toUpperCase()] && link.url);
  if (!links.length) return null;

  return (
    <div className="flex gap-2">
      {links.map((link) => {
        const network = NETWORKS[link.network.toUpperCase()];
        return (
          <a
            key={link.network}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={network.label}
            title={network.label}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20 hover:text-gold"
          >
            <Icon name={network.icon} />
          </a>
        );
      })}
    </div>
  );
}
