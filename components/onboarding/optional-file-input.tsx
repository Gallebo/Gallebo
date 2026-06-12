"use client";

import { FileText, Upload } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { cn } from "@/lib/utils";

type OptionalFileInputProps = {
  id: string;
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
  hint?: string;
};

function isImageFile(file: File) {
  return file.type.startsWith("image/");
}

export function OptionalFileInput({
  id,
  accept,
  file,
  onFileChange,
  className,
  disabled,
  hint = "PDF, JPEG or PNG",
}: OptionalFileInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file || !isImageFile(file)) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleRemove = () => {
    onFileChange(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onFileChange(e.target.files?.[0] ?? null);
  };

  if (file) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-[var(--radius-base)] border px-3 py-2.5",
          className,
        )}
        style={{
          borderColor: "var(--line)",
          background: "var(--surface)",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob preview of local file
          <img
            src={previewUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md border object-cover"
            style={{ borderColor: "var(--line)" }}
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border"
            style={{ borderColor: "var(--line)", background: "var(--surface-alt)" }}
            aria-hidden
          >
            <FileText className="h-6 w-6 text-[var(--ink-3)]" />
          </div>
        )}
        <span className="min-w-0 flex-1 truncate text-[14px]" title={file.name}>
          {file.name}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="shrink-0 rounded-md px-2 py-1 text-[13px] text-[var(--ink-3)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)] disabled:opacity-50"
          aria-label="Remove file"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[var(--radius-base)] border border-dashed px-4 py-8 text-center transition-colors",
        disabled ? "cursor-not-allowed opacity-50" : "hover:border-[var(--primary-v2)] hover:bg-[var(--primary-soft)]",
        className,
      )}
      style={{
        borderColor: "var(--line-strong)",
        background: "var(--surface-alt)",
      }}
    >
      <Upload className="size-6 text-[var(--primary-v2)]" aria-hidden />
      <span className="text-[14px] font-medium text-[var(--ink)]">Choose file</span>
      <span className="text-[12px] text-[var(--ink-3)]">{hint}</span>
      <input
        id={id}
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        className="sr-only"
        onChange={handleChange}
      />
    </label>
  );
}
