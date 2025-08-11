import { pipeline, env } from "@huggingface/transformers";

// Configure transformers.js
env.allowLocalModels = false;
// Use browser cache to avoid repeated downloads between runs
env.useBrowserCache = true;

const MAX_IMAGE_DIMENSION = 1024;

function drawImageToCanvas(image: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  let width = image.naturalWidth;
  let height = image.naturalHeight;

  if (width > MAX_IMAGE_DIMENSION || height > MAX_IMAGE_DIMENSION) {
    if (width > height) {
      height = Math.round((height * MAX_IMAGE_DIMENSION) / width);
      width = MAX_IMAGE_DIMENSION;
    } else {
      width = Math.round((width * MAX_IMAGE_DIMENSION) / height);
      height = MAX_IMAGE_DIMENSION;
    }
  }

  canvas.width = width;
  canvas.height = height;
  ctx.drawImage(image, 0, 0, width, height);
  return { canvas, ctx };
}

export const loadImage = (src: string | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // handle same-origin uploads and remote urls
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
};

export type ExtractMode = "keep-subject" | "keep-background";

export const extractWithSegmentation = async (
  image: HTMLImageElement,
  mode: ExtractMode = "keep-background"
): Promise<Blob> => {
  // Create source canvas from image
  const { canvas } = drawImageToCanvas(image);
  const srcDataUrl = canvas.toDataURL("image/jpeg", 0.9);

  // Load the segmentation pipeline
  const segmenter = await pipeline(
    "image-segmentation",
    "Xenova/segformer-b0-finetuned-ade-512-512",
    {
      device: "webgpu",
    }
  );

  const result: any = await segmenter(srcDataUrl);
  if (!result || !Array.isArray(result) || !result[0]?.mask?.data) {
    throw new Error("Invalid segmentation result");
  }

  // Prepare output canvas
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = canvas.width;
  outputCanvas.height = canvas.height;
  const outputCtx = outputCanvas.getContext("2d");
  if (!outputCtx) throw new Error("Could not get output canvas context");

  // Draw original image first
  outputCtx.drawImage(canvas, 0, 0);

  // Apply mask to alpha channel
  const outputImageData = outputCtx.getImageData(0, 0, outputCanvas.width, outputCanvas.height);
  const data = outputImageData.data;
  const maskData: Float32Array | Uint8Array = result[0].mask.data;

  // If model returns Uint8 values 0..255, normalize to 0..1
  const getMaskVal = (i: number) => {
    const v = (maskData as any)[i];
    return v > 1 ? v / 255 : v; // normalize
  };

  for (let i = 0; i < outputCanvas.width * outputCanvas.height; i++) {
    const m = getMaskVal(i); // probability-like value
    // In the provided example, (1 - mask) kept the subject.
    // We support both modes explicitly:
    const alpha = mode === "keep-subject" ? Math.round((1 - m) * 255) : Math.round(m * 255);
    data[i * 4 + 3] = alpha;
  }

  outputCtx.putImageData(outputImageData, 0, 0);

  return new Promise((resolve, reject) => {
    outputCanvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Failed to create blob"))), "image/png", 1);
  });
};
