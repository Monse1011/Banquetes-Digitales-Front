"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ApiError } from "@/lib/api/http";

type QueryState<T> = { data: T | undefined; error: ApiError | Error | null; loading: boolean };

/**
 * Carga datos al montar y cada vez que cambia `key`. `reload()` vuelve a pedirlos
 * conservando los datos previos en pantalla.
 */
export function useQuery<T>(fetcher: () => Promise<T>, key: string, enabled = true) {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, error: null, loading: enabled });
  const fetcherRef = useRef(fetcher);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca de carga antes de la petición
    setState((s) => ({ ...s, loading: true, error: null }));
    fetcherRef.current()
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch((error: Error) => active && setState((s) => ({ ...s, error, loading: false })));
    return () => {
      active = false;
    };
  }, [key, revision, enabled]);

  const reload = useCallback(() => setRevision((r) => r + 1), []);
  const setData = useCallback((updater: (data: T | undefined) => T | undefined) => {
    setState((s) => ({ ...s, data: updater(s.data) }));
  }, []);

  return { ...state, reload, setData };
}

/** Filtros persistidos en la query string (permite compartir/recargar la vista). */
export function useUrlFilters<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const filters = { ...defaults } as T;
  for (const key of Object.keys(defaults) as (keyof T & string)[]) {
    const value = searchParams.get(key);
    if (value !== null) (filters as Record<string, string>)[key] = value;
  }

  const setFilters = useCallback(
    (patch: Partial<T>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      const next: Record<string, string | undefined> = { ...patch };
      if (resetPage && !("page" in patch) && "page" in defaults) next.page = "1";
      for (const [key, value] of Object.entries(next)) {
        if (value === undefined || value === "" || value === defaults[key]) params.delete(key);
        else params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname, defaults],
  );

  return [filters, setFilters] as const;
}

/** Valor con retraso, para búsquedas por texto. */
export function useDebounced<T>(value: T, delay = 350): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
