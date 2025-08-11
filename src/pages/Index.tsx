import React from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Index = () => {
  const { data } = useQuery({
    queryKey: ["home-catalog"],
    queryFn: async () => {
      const client: any = supabase as any;
      const { data, error } = await client
        .from("rubber_catalog")
        .select("marka, tu")
        .order("tu", { ascending: true })
        .order("marka", { ascending: true })
        .range(0, 49);
      if (error) throw error;
      return (data ?? []).filter((i: any) => i.marka && i.tu);
    },
  });

  return (
    <div className="min-h-screen">
      <iframe
        src="/landing.html"
        title="Строймаш — лендинг"
        className="w-full h-screen"
        style={{ border: "0" }}
      />

      <section id="catalog" className="container mx-auto max-w-6xl py-12">
        <header className="mb-6">
          <h2 className="text-2xl font-semibold">Каталог: ТУ и марка</h2>
          <p className="text-muted-foreground mt-1">Нажмите на позицию, чтобы посмотреть характеристики.</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((item: any, idx: number) => (
            <Link key={`${item.marka}-${item.tu}-${idx}`} to={`/rubber/${encodeURIComponent(item.marka)}/${encodeURIComponent(item.tu)}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="text-muted-foreground">ТУ</span>
                    <span>{item.tu}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Марка:</span> <span className="font-medium">{item.marka}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
        <div className="text-right mt-6">
          <Link to="/catalog" className="text-primary underline-offset-4 hover:underline">Открыть полный каталог →</Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
