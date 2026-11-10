import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GallerySection } from "./gallery-section";
import { PromotionsSection } from "./promotions-section";
import { SECTION_EMPTY_MESSAGE, SECTION_ERROR_MESSAGE } from "./section-state";
import { ServicesGrid } from "./services-grid";
import { SocialLinks } from "./social-links";

function stubFetch(routes: Record<string, { status: number; body?: unknown }>) {
  const fetchMock = vi.fn(async (url: string) => {
    const route = routes[url] ?? { status: 404, body: { message: "No encontrado" } };
    return new Response(route.body === undefined ? null : JSON.stringify(route.body), { status: route.status });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("secciones públicas del sitio", () => {
  it("servicios: nombre, descripción y precio con detalle al seleccionar (RF-3.4.1.2.3)", async () => {
    stubFetch({
      "/api/client/services": {
        status: 200,
        body: { data: { services: [{ id: 1, name: "Banquetes y bebidas", description: "Menú de autor", price: 1500 }] } },
      },
    });
    render(<ServicesGrid />);
    expect(await screen.findByText("Banquetes y bebidas")).toBeTruthy();
    expect(screen.getByText("Menú de autor")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Banquetes y bebidas/ }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("$1,500.00")).toBeTruthy();
  });

  it("servicios: mensaje informativo sin elementos y error acotado (RF-3.4.1.2.5 y 2.8)", async () => {
    stubFetch({ "/api/client/services": { status: 200, body: { data: { services: [] } } } });
    const { unmount } = render(<ServicesGrid />);
    expect(await screen.findByText(SECTION_EMPTY_MESSAGE)).toBeTruthy();
    unmount();

    stubFetch({ "/api/client/services": { status: 500, body: { message: "error" } } });
    render(<ServicesGrid />);
    expect(await screen.findByText(SECTION_ERROR_MESSAGE)).toBeTruthy();
  });

  it("promociones: descuento y vigencia con detalle", async () => {
    stubFetch({
      "/api/client/promotions": {
        status: 200,
        body: { data: { promotions: [{ id: 1, name: "Temporada", description: "Aplica hoy", discount_percentage: 10, valid_until: "2026-12-31" }] } },
      },
    });
    render(<PromotionsSection />);
    expect(await screen.findByText("Temporada")).toBeTruthy();
    expect(screen.getByText("−10.00%")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /Temporada/ }));
    expect(await screen.findByRole("dialog")).toBeTruthy();
    expect(screen.getByText("10.00%")).toBeTruthy();
  });

  it("galería: lightbox con controles para avanzar y regresar (RF-3.4.1.2.4)", async () => {
    stubFetch({
      "/api/client/gallery": {
        status: 200,
        body: { data: { gallery: [{ id: 1, url: "/a.jpg", title: "Boda" }, { id: 2, url: "/b.jpg", title: "XV" }] } },
      },
    });
    render(<GallerySection />);
    fireEvent.click(await screen.findByRole("button", { name: /Ampliar fotografía Boda/ }));
    expect(await screen.findByText("1 / 2")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Anterior/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Siguiente/ }));
    expect(screen.getByText("2 / 2")).toBeTruthy();
    expect((screen.getByRole("button", { name: /Siguiente/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /Anterior/ }));
    expect(screen.getByText("1 / 2")).toBeTruthy();
  });

  it("redes sociales: solo iconos con enlace registrado y abren en pestaña nueva (RF-3.4.1.3)", async () => {
    stubFetch({
      "/api/client/social-links": {
        status: 200,
        body: { data: { social_links: [{ network: "FACEBOOK", url: "https://fb.test" }, { network: "TIKTOK", url: "https://tt.test" }] } },
      },
    });
    const { container } = render(<SocialLinks />);
    const links = await screen.findAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveProperty("target", "_blank");
    expect(container.querySelector("a")?.getAttribute("href")).toBe("https://fb.test");
  });

  it("redes sociales: sin enlaces registrados no muestra iconos", async () => {
    stubFetch({ "/api/client/social-links": { status: 200, body: { data: { social_links: [] } } } });
    const { container } = render(<SocialLinks />);
    expect(container.querySelector("a")).toBeNull();
  });
});
