"use client";

import { useRef, useState } from "react";
import { uploadImage, UploadError, type UploadFolder } from "./cloudinary-upload";
import { ImagePreparationError, looksLikeImage, prepareImageForUpload } from "./prepare-image";
import { errorClass, hintClass, inputClass, labelClass, secondaryButtonClass } from "./ui";

export default function ImageUploadField({
  folder,
  label,
  hint,
  value,
  onChange,
  onUploadingChange,
}: {
  // Cloudinary folder; must be allowed in app/api/upload/route.ts.
  folder: UploadFolder;
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(original: File | undefined) {
    if (!original) return;
    if (!looksLikeImage(original)) {
      setError("Ce fichier n’est pas une image.");
      return;
    }
    setError(null);
    setProgress(0);
    onUploadingChange(true);
    try {
      const file = await prepareImageForUpload(original);
      onChange(await uploadImage(file, folder, setProgress));
    } catch (err) {
      setError(
        err instanceof ImagePreparationError || err instanceof UploadError
          ? err.message
          : "Échec du téléversement. Vérifiez votre connexion et réessayez."
      );
    } finally {
      setProgress(null);
      onUploadingChange(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div
      // Outline (not border/padding) so the drop highlight never shifts the
      // field off the column edge the other inputs align to.
      className={`mt-4 rounded ${
        dragging ? "bg-ink/5 outline-dashed outline-2 outline-offset-8 outline-ink" : ""
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
    >
      <p className={labelClass}>{label}</p>
      <p className={`mt-2 ${hintClass}`}>{hint}</p>

      {value ? (
        <div className="mt-2 flex items-end gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Aperçu"
            className="h-24 w-24 rounded border border-ink/10 object-cover"
          />
          <button type="button" onClick={() => onChange("")} className={secondaryButtonClass}>
            Retirer
          </button>
        </div>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={progress !== null}
          className={secondaryButtonClass}
        >
          {progress !== null
            ? `Téléversement… ${progress} %`
            : value
              ? "Remplacer l’image"
              : "Téléverser une image"}
        </button>
        {/* Drag-and-drop only exists with a mouse; don't promise it on phones. */}
        <span className={`hidden [@media(pointer:fine)]:inline ${hintClass}`}>
          ou glissez un fichier ici
        </span>
      </div>

      <label className={`mt-2 block ${hintClass}`}>
        Ou collez un lien :
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`mt-2 ${inputClass}`}
          placeholder="https://…"
        />
      </label>

      {error ? <p className={`mt-2 ${errorClass}`}>{error}</p> : null}
    </div>
  );
}
