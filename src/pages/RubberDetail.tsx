import React, { useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Item {
  marka: string | null;
  tu: string | null;
  purpose: string | null;
  work_conditions: string | null;
  hardness_shore_a: string | null;
  strength_mpa: string | null;
  elongation_percent: string | null;
  shelf_life_months: string | null;
}

export default function RubberDetail() {
  const { marka, tu } = useParams<{ marka: string; tu: string }>();

  useEffect(() => {
    if (marka && tu) {
      document.title = `${marka} — ${tu} | Строймаш`;
    }
  }, [marka, tu]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["rubber-detail", marka, tu],
    queryFn: async () => {
      const client: any = supabase as any;
      const { data, error } = await client
        .from("rubber_catalog")
        .select("marka, tu, purpose, work_conditions, hardness_shore_a, strength_mpa, elongation_percent, shelf_life_months")
        .eq("marka", decodeURIComponent(marka || ""))
        .eq("tu", decodeURIComponent(tu || ""))
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Item | null;
    },
    enabled: Boolean(marka && tu),
  });

  return (
    <main className="container mx-auto max-w-4xl py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold">{marka} — {tu}</h1>
        <p className="text-muted-foreground mt-1">Полные характеристики резиновой смеси.</p>
      </header>

      {isLoading ? (
        <p className="text-muted-foreground">Загрузка…</p>
      ) : error ? (
        <p className="text-destructive">Ошибка загрузки</p>
      ) : !data ? (
        <p className="text-muted-foreground">Данные не найдены.</p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Характеристики</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <div>
              <div className="text-sm text-muted-foreground">Марка</div>
              <div className="font-medium">{data.marka}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">ТУ</div>
              <div className="font-medium">{data.tu}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Назначение</div>
              <div>{data.purpose || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Условия работы</div>
              <div>{data.work_conditions || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Твердость (Шор A)</div>
              <div>{data.hardness_shore_a || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Прочность (МПа)</div>
              <div>{data.strength_mpa || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Удлинение (%)</div>
              <div>{data.elongation_percent || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Срок хранения (мес.)</div>
              <div>{data.shelf_life_months || "—"}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex gap-2">
        <Button asChild variant="outline"><Link to="/">На главную</Link></Button>
        <Button asChild variant="secondary"><Link to="/catalog">В каталог</Link></Button>
      </div>
    </main>
  );
}
