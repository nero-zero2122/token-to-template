import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Types for the catalog view
export type CatalogItem = {
  marka: string | null;
  work_conditions: string | null;
  purpose: string | null;
  strength_mpa: string | null;
  elongation_percent: string | null;
  hardness_shore_a: string | null;
  shelf_life_months: string | null;
  tu: string | null;
};

const PAGE_SIZE = 20;

type QueryResult = { items: CatalogItem[]; count: number };

export default function Catalog() {
  // SEO tags
  useEffect(() => {
    document.title = "Каталог резиновых смесей — Строймаш";
    const ensureMeta = (name: string, content: string) => {
      let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", name);
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };
    ensureMeta("description", "Каталог резиновых смесей: марка, ТУ и полные характеристики.");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "/catalog");
  }, []);

  // Filters
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"marka" | "tu">("marka");

  const { data, isLoading, error } = useQuery({
    queryKey: ["catalog", page, search, sort],
    queryFn: async () => {
      const client: any = supabase as any;
      let query = client.from("rubber_catalog").select("*", { count: "exact" });

      if (search.trim()) query = query.ilike("marka", `%${search.trim()}%`);

      const orderColumn = sort === "tu" ? "tu" : "marka";
      query = query.order(orderColumn, { ascending: true });

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      return { items: (data as unknown as CatalogItem[]) ?? [], count: count ?? 0 } as QueryResult;
    },
  });

  // Результаты (без клиентских фильтров твердости)
  const filtered = data?.items ?? [];

  const total = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main id="catalog">
      <header className="container mx-auto max-w-6xl py-8">
        <h1 className="text-3xl font-semibold">Каталог резиновых смесей</h1>
        <p className="text-muted-foreground mt-2">Поиск и фильтры из базы Supabase</p>
      </header>

      <section className="container mx-auto max-w-6xl pb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm">Поиск по марке</label>
            <Input placeholder="Например: NBR" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Сортировка</label>
            <Select value={sort} onValueChange={(v) => setSort(v as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Выберите сортировку" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marka">По марке</SelectItem>
                <SelectItem value="tu">По ТУ</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="secondary" className="w-full" onClick={() => { setSearch(""); setPage(1); }}>Сбросить</Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl">
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ТУ</TableHead>
                <TableHead>Марка</TableHead>
                <TableHead>Назначение</TableHead>
                <TableHead>Условия работы</TableHead>
                <TableHead>Твердость (Шор A)</TableHead>
                <TableHead>Прочность (МПа)</TableHead>
                <TableHead>Удлинение (%)</TableHead>
                <TableHead>Срок хранения (мес.)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">Загрузка…</TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-destructive">Ошибка загрузки</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">Ничего не найдено</TableCell>
                </TableRow>
              ) : (
                filtered.map((item, idx) => (
                  <TableRow key={`${item.marka}-${idx}`}>
                    <TableCell>
                      {item.tu ? (
                        <Link
                          to={`/rubber/${encodeURIComponent(item.marka || "")}/${encodeURIComponent(item.tu)}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {item.tu}
                        </Link>
                      ) : (
                        item.tu
                      )}
                    </TableCell>
                    <TableCell>
                      {item.marka ? (
                        <Link
                          to={`/rubber/${encodeURIComponent(item.marka)}/${encodeURIComponent(item.tu || "")}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {item.marka}
                        </Link>
                      ) : (
                        item.marka
                      )}
                    </TableCell>
                    <TableCell>{item.purpose}</TableCell>
                    <TableCell>{item.work_conditions}</TableCell>
                    <TableCell>{item.hardness_shore_a}</TableCell>
                    <TableCell>{item.strength_mpa}</TableCell>
                    <TableCell>{item.elongation_percent}</TableCell>
                    <TableCell>{item.shelf_life_months}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">Всего: {total.toLocaleString()} | Стр. {page} из {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</Button>
            <Button variant="default" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Вперед</Button>
          </div>
        </div>
      </section>
    </main>
  );
}
