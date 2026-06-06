"use client";

import { FileText } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent } from "react";

import { cn } from "@/lib/utils";

type OptionalFileInputProps = {
  id: string;
  accept?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  className?: string;
  disabled?: boolean;
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
          "flex items-center gap-3 rounded-md border border-input bg-background px-3 py-2 text-sm",
          className,
        )}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- blob preview of local file
          <img
            src={previewUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border bg-muted"
            aria-hidden
          >
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
        )}
        <span className="min-w-0 flex-1 truncate" title={file.name}>
          {file.name}
        </span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="shrink-0 rounded px-2 py-0.5 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
          aria-label="Remove file"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <input
      id={id}
      ref={inputRef}
      type="file"
      accept={accept}
      disabled={disabled}
      className={cn("block w-full text-sm", className)}
      onChange={handleChange}
    />
  );
}
