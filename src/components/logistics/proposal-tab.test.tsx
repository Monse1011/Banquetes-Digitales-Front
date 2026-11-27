import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import type { AssignedRequestDetail } from "@/lib/api/logistics";
import { ProposalTab } from "./proposal-tab";

type RequestInitInit = RequestInit & { body?: string };

const DETAIL: AssignedRequestDetail = {
  request_id: 7,
  folio: "BD-2026-00021",
  client: { client_name: "Ana López", client_email: "ana@x.co", client_phone: "9991234567" },
  event_date: "2026-12-24",
  start_time: "18:00",
  end_time: "23:00",
  schedule_type: "FIJO",
  event_address: "Mérida",
  guest_count: 100,
  selected_services: [],
  status: "COORDINATION_READY",
  proposal_viewed_at: null,
  can_register_agreements: true,
  can_register_finalization: false,
  adjustments: [],
};

function stubFetch() {
  const posts: unknown[] = [];
  const fetchMock = vi.fn(async (url: string, init: RequestInitInit = {}) => {
    if (init.method === "POST" && url.endsWith("/proposals")) {
      posts.push(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ data: { proposal_id: 31, proposals_code: "PROP-2026-0008", status: "DRAFT" } }), { status: 201 });
    }
    if (url.endsWith("/proposals")) return new Response(JSON.stringify({ message: "Sin propuesta" }), { status: 404 });
    if (url.endsWith("/derived-information")) {
      return new Response(
        JSON.stringify({
          data: {
            derived_information_id: 5,
            assigned_resources: [{ resource_id: 1, name: "Menú", type: "MATERIAL", quantity: 2, unit_cost: 100 }],
          },
        }),
        { status: 200 },
      );
    }
    if (url.startsWith("/api/client/promotions")) {
      return new Response(
        JSON.stringify({ data: { promotions: [{ id: 4, name: "Temporada", description: "d", discount_percentage: 10, valid_until: "2026-12-31" }] } }),
        { status: 200 },
      );
    }
    return new Response(null, { status: 200 });
  });
  vi.stubGlobal("fetch", fetchMock);
  return posts;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Generación de propuesta con promoción (contrato 18)", () => {
  it("ofrece promociones vigentes y estima el descuento", async () => {
    stubFetch();
    render(
      <ToastProvider>
        <ProposalTab detail={DETAIL} onChanged={() => undefined} />
      </ToastProvider>,
    );
    const select = (await screen.findByLabelText(/Promoción/)) as HTMLSelectElement;
    expect(await screen.findByText("Temporada (−10.00%)")).toBeTruthy();
    expect(Array.from(select.options).map((o) => o.textContent)).toEqual(["Sin promoción", "Temporada (−10.00%)"]);
    expect(screen.queryByLabelText(/Observaciones para el cliente/)).toBeNull();
    expect(screen.queryByLabelText(/Descuento \(MXN\)/)).toBeNull();
    fireEvent.change(select, { target: { value: "4" } });
    expect(screen.getByText("$180.00")).toBeTruthy();
  });

  it("envía promotion_id elegido o null sin observaciones del cliente", async () => {
    const posts = stubFetch();
    render(
      <ToastProvider>
        <ProposalTab detail={DETAIL} onChanged={() => undefined} />
      </ToastProvider>,
    );
    await screen.findByLabelText(/Promoción/);
    fireEvent.click(screen.getByRole("button", { name: /Generar PDF/ }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ data: { derived_information_id: 5, promotion_id: null } });

    fireEvent.change(screen.getByLabelText(/Promoción/), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: /Generar PDF/ }));
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1]).toEqual({ data: { derived_information_id: 5, promotion_id: 4 } });
  });
});
