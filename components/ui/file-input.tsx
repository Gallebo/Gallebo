"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { FormHint } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

type FileInputProps = {
  id: string;
  name: string;
  accept?: string;
  required?: boolean;
  hint?: string;
  chooseLabel?: string;
  className?: string;
};

function syncFileInput(input: HTMLInputElement, files: File[]) {
  const dt = new DataTransfer();
  for (const file of files) {
    dt.items.add(file);
  }
  input.files = dt.files;
}

export function FileInput({
  id,
  name,
  accept = "image/jpeg,image/png",
  required = false,
  hint = "JPEG or PNG",
  chooseLabel = "Choose photos",
  className,
}: FileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const urls = photos.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => {
      for (const url of urls) {
        URL.revokeObjectURL(url);
      }
    };
  }, [photos]);

  useEffect(() => {
    if (inputRef.current) {
      syncFileInput(inputRef.current, photos);
    }
  }, [photos]);

  const handleAdd = (e: ChangeEvent<HTMLInputElement>) => {
    const incoming = Array.from(e.target.files ?? []);
    if (incoming.length === 0) return;
    setPhotos((prev) => [...prev, ...incoming]);
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className={cn("space-y-3", className)}>
      {photos.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[13px] text-[var(--ink-3)]">
            {photos.length} photo{photos.length === 1 ? "" : "s"} selected
          </p>
          <ul
            className="grid grid-cols-2 gap-3 sm:grid-cols-3"
            aria-live="polite"
          >
            {photos.map((file, index) => (
              <li
                key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                className="relative aspect-square overflow-hidden rounded-[var(--radius-base)] border"
                style={{ borderColor: "var(--line)" }}
              >
                {previewUrls[index] ? (
                  // eslint-disable-next-line @next/next/no-img-element -- blob preview of local file
                  <img
                    src={previewUrls[index]}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="absolute top-1.5 right-1.5 flex size-7 items-center justify-center rounded-full border bg-[var(--surface)]/95 text-[var(--ink)] shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-alt)]"
                  style={{ borderColor: "var(--line)" }}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="size-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <label
        htmlFor={id}
        className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-base)] border border-dashed px-4 py-8 text-center transition-colors hover:border-[var(--primary-v2)] hover:bg-[var(--primary-soft)]"
        style={{
          borderColor: "var(--line-strong)",
          background: "var(--surface-alt)",
        }}
      >
        <Upload className="size-6 text-[var(--primary-v2)]" aria-hidden />
        <span className="text-[14px] font-medium text-[var(--ink)]">
          {photos.length > 0 ? "Add more photos" : chooseLabel}
        </span>
        <FormHint>{hint}</FormHint>
      </label>

      <input
        ref={inputRef}
        id={id}
        type="file"
        name={name}
        accept={accept}
        multiple
        required={required}
        className="sr-only"
        onChange={handleAdd}
        tabIndex={-1}
      />
    </div>
  );
}
