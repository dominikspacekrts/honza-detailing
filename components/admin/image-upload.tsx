"use client";

import { useId, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Nahraje obrázek do Supabase Storage a vrátí veřejnou URL.
 * Hodnota se drží ve skrytém inputu, takže funguje i uvnitř server action formuláře.
 */
export function ImageUpload({
  name,
  label,
  bucket = "gallery",
  defaultValue = "",
  hint,
  required = false,
  onValueChange,
}: {
  name: string;
  label: string;
  bucket?: "gallery" | "site";
  defaultValue?: string;
  hint?: string;
  required?: boolean;
  /** Volitelné napojení na stav rodiče (editor vzhledu). */
  onValueChange?: (url: string) => void;
}) {
  const [internal, setInternal] = useState(defaultValue);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  // S `onValueChange` je hodnota řízená rodičem, jinak vlastním stavem.
  const url = onValueChange ? defaultValue : internal;
  const setUrl = (value: string) => {
    setInternal(value);
    onValueChange?.(value);
  };

  async function upload(file: File) {
    setError(null);

    if (!file.type.startsWith("image/")) {
      setError("Vyberte prosím obrázek.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Obrázek je větší než 8 MB. Zmenšete ho prosím.");
      return;
    }

    setBusy(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${new Date().getFullYear()}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { cacheControl: "31536000", upsert: false });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      setUrl(data.publicUrl);
    } catch (e) {
      setError(
        (e as Error).message.includes("row-level security")
          ? "Nahrání zamítnuto — účet nemá práva administrátora."
          : "Nahrání se nepodařilo. Zkuste to prosím znovu.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <span className="label">{label}</span>
      <input type="hidden" name={name} value={url} required={required} />

      <div className="flex items-start gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className={`relative grid aspect-4/3 w-36 shrink-0 place-items-center overflow-hidden rounded-xl border border-dashed transition-colors ${
            url
              ? "border-[var(--line)]"
              : "hover:border-accent/50 border-[var(--line-strong)]"
          }`}
        >
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="size-full object-cover" />
          ) : (
            <span className="text-ink-faint px-2 text-center text-xs">
              {busy ? "Nahrávám…" : "Klikněte pro výběr"}
            </span>
          )}
          {busy && <span className="absolute inset-0 bg-black/50 backdrop-blur-sm" />}
        </button>

        <div className="min-w-0 flex-1">
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
              e.target.value = "";
            }}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn btn-ghost btn-sm"
              disabled={busy}
            >
              {url ? "Nahradit" : "Nahrát fotku"}
            </button>
            {url && (
              <button
                type="button"
                onClick={() => setUrl("")}
                className="btn btn-ghost btn-sm text-red-300"
              >
                Odebrat
              </button>
            )}
          </div>

          <input
            className="field mt-3 text-xs"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="…nebo vložte odkaz na obrázek"
          />

          {hint && <p className="text-ink-faint mt-2 text-xs">{hint}</p>}
          {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
