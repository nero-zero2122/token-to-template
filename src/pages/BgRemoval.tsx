import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/toaster";

import { extractWithSegmentation, loadImage, type ExtractMode } from "@/lib/bgRemoval";

const DEFAULT_IMAGE = "/lovable-uploads/00d63a55-07b7-494f-9a97-07ed08d1b46f.png"; // uploaded screenshot

const BgRemoval: React.FC = () => {
  const [sourceUrl, setSourceUrl] = useState<string>(DEFAULT_IMAGE);
  const [processing, setProcessing] = useState<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);

  const handleProcess = async (mode: ExtractMode) => {
    try {
      setProcessing(true);
      setError(null);

      const img = await loadImage(sourceUrl);
      imgRef.current = img;
      const blob = await extractWithSegmentation(img, mode);
      const url = URL.createObjectURL(blob);
      setResultUrl(url);
    } catch (e: any) {
      console.error(e);
      setError(e?.message || "Failed to process image");
    } finally {
      setProcessing(false);
    }
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setSourceUrl(localUrl);
    setResultUrl(null);
  };

  return (
    <main className="min-h-screen py-12">
      <Toaster />
      <section className="container mx-auto max-w-5xl">
        <header className="mb-8">
          <h1 className="text-3xl font-semibold">Background extractor</h1>
          <p className="text-muted-foreground mt-2">Client-side tool powered by transformers.js. Choose: keep only background or only subject.</p>
        </header>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <article>
            <h2 className="text-lg font-medium mb-3">Source</h2>
            <div className="flex items-center gap-3 mb-4">
              <input type="file" accept="image/*" onChange={onFileChange} />
              <Button variant="secondary" onClick={() => setSourceUrl(DEFAULT_IMAGE)}>Use uploaded screenshot</Button>
            </div>
            <div className="rounded-lg border p-4 bg-card">
              <img src={sourceUrl} alt="Source" className="w-full h-auto rounded-md" />
            </div>
          </article>

          <article>
            <h2 className="text-lg font-medium mb-3">Result</h2>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button disabled={processing} onClick={() => handleProcess("keep-background")}>Extract background</Button>
              <Button variant="outline" disabled={processing} onClick={() => handleProcess("keep-subject")}>Extract subject</Button>
            </div>
            {error && <p className="text-destructive mb-2">{error}</p>}
            <div className="rounded-lg border p-4 bg-card min-h-[200px] grid place-items-center">
              {processing ? (
                <p className="text-muted-foreground">Processing… first run may take a minute to load the model.</p>
              ) : resultUrl ? (
                <img src={resultUrl} alt="Result" className="w-full h-auto rounded-md" />
              ) : (
                <p className="text-muted-foreground">No result yet.</p>
              )}
            </div>
            {resultUrl && (
              <div className="mt-3">
                <a href={resultUrl} download="extracted.png" className="underline">Download PNG</a>
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
};

export default BgRemoval;
