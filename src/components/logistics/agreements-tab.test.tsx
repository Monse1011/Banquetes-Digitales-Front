import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/toast";
import { AgreementsTab } from "./agreements-tab";

const AGREEMENTS = {
  derived_information_id: 5,
  request_id: 1,
  folio: "BD-2026-00001",
  status: "Coordinación Lista",
  client: { client_name: "Mariana Gómez", client_email: "m@x.com", client_phone: "9991234567" },
  location: "Hacienda",
  start_datetime: "2030-05-01T18:00:00-06:00",
  end_datetime: "2030-05-01T23:00:00-06:00",
  event_date: "2030-05-01",
  end_date: "2030-05-01",
  observations: null,
  confirmation_observations: null,
  start_time: "18:00",
  end_time: "23:00",
  schedule_type: "propuesto",
  guest_count: 100,
  can_register_agreements: true,
  assigned_resources: [
    { resource_id: 1, name: "Ana López", type: "HUMAN", quantity: 1, unit_cost: null },
    { resource_id: 2, name: "Sillas", type: "MATERIAL", quantity: 50, unit_cost: 10 },
    { resource_id: 3, name: "Camioneta", type: "LOGISTIC", quantity: 1, unit_cost: 500 },
  ],
};

let postResponses: Response[];
let posts: { adjusted_resources: { resource_id: number; quantity: number }[] }[];

beforeEach(() => {
  posts = [];
  postResponses = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (_url: string, init: RequestInit) => {
      if (init.method === "POST") {
        posts.push(JSON.parse(String(init.body)).data);
        return postResponses.shift() ?? new Response(JSON.stringify({ data: { derived_information_id: 6 } }), { status: 201 });
      }
      return new Response(JSON.stringify({ data: AGREEMENTS }), { status: 200 });
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function setup() {
  render(
    <ToastProvider>
      <AgreementsTab requestId={1} onChanged={() => undefined} />
    </ToastProvider>,
  );
  await screen.findByLabelText("Cantidad de Sillas");
}

const quantity = (name: string) => screen.getByLabelText(`Cantidad de ${name}`) as HTMLInputElement;
const type = (name: string, value: string) => fireEvent.change(quantity(name), { target: { value } });
const save = () => fireEvent.click(screen.getByRole("button", { name: "Guardar acuerdos" }));

describe("AgreementsTab", () => {
  it("no envía los recursos que el usuario no tocó", async () => {
    await setup();
    type("Sillas", "60");
    save();
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].adjusted_resources).toEqual([{ resource_id: 2, quantity: 60 }]);
  });

  it("cantidad 0 muestra «Se liberará al guardar» y envía quantity 0", async () => {
    await setup();
    expect(screen.queryByText("Se liberará al guardar")).toBeNull();
    type("Ana López", "0");
    expect(screen.getByText("Se liberará al guardar")).toBeTruthy();
    save();
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0].adjusted_resources).toEqual([{ resource_id: 1, quantity: 0 }]);
  });

  it("una cantidad vacía no cuenta como 0: no libera ni envía", async () => {
    await setup();
    type("Camioneta", "");
    expect(screen.queryByText("Se liberará al guardar")).toBeNull();
    save();
    await new Promise((r) => setTimeout(r, 20));
    expect(posts).toHaveLength(0);
  });

  it("tras un 400 muestra el error del campo, se desbloquea y permite reasignar", async () => {
    const message = "Ana López: La cantidad ajustada de un recurso humano debe ser 1 o 0 para liberarlo.";
    postResponses.push(new Response(JSON.stringify({ message, errors: { adjusted_resources: message } }), { status: 400 }));
    await setup();
    type("Ana López", "2");
    save();
    expect((await screen.findAllByText(message)).length).toBeGreaterThan(0);
    // Desbloqueado: inputs y botón habilitados de nuevo.
    expect(quantity("Ana López").disabled).toBe(false);
    expect((screen.getByRole("button", { name: "Guardar acuerdos" }) as HTMLButtonElement).disabled).toBe(false);

    type("Ana López", "1");
    type("Sillas", "40");
    save();
    await waitFor(() => expect(posts).toHaveLength(2));
    expect(posts[1].adjusted_resources).toEqual([{ resource_id: 2, quantity: 40 }]);
  });
});
