"use client";

import { useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import { uploadImage, UploadError, type UploadFolder } from "./cloudinary-upload";
import { ImagePreparationError, looksLikeImage, prepareImageForUpload } from "./prepare-image";

// Only what the public pages render (see lib/legal-html.ts and
// lib/blog-html.ts allowlists); images only when the caller enables them.
const baseExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3] },
    code: false,
    codeBlock: false,
    horizontalRule: false,
    link: {
      openOnClick: false,
      autolink: true,
      defaultProtocol: "https",
      protocols: ["mailto", "tel"],
    },
  }),
];

const INACTIVE_TOOLBAR = {
  h2: false,
  h3: false,
  bold: false,
  italic: false,
  underline: false,
  bulletList: false,
  orderedList: false,
  link: false,
  image: null as ImageSize | null,
  canUndo: false,
  canRedo: false,
};

function ToolbarButton({
  label,
  title,
  active = false,
  disabled = false,
  onClick,
}: {
  label: React.ReactNode;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      disabled={disabled}
      // Keep focus (and the selection) in the editor while clicking.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded px-2 text-sm font-medium transition-colors disabled:opacity-30 ${
        active ? "bg-ink text-canvas" : "text-ink hover:bg-ink/10"
      }`}
    >
      {label}
    </button>
  );
}

function editLink(editor: Editor) {
  const current = editor.getAttributes("link").href as string | undefined;
  const input = window.prompt("Adresse du lien (site web, e-mail ou téléphone) :", current ?? "https://");
  if (input === null) return;
  let href = input.trim();
  if (!href || href === "https://") {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    return;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(href)) href = `mailto:${href}`;
  else if (!/^(https?:|mailto:|tel:)/i.test(href)) href = `https://${href}`;
  editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
}

// Display size of an image in a post, stored as data-size (sanitized in
// lib/blog-html.ts, sized by the .rich-text rules in app/globals.css).
const IMAGE_SIZES = [
  { value: "small", label: "Petite" },
  { value: "medium", label: "Moyenne" },
  { value: "large", label: "Grande" },
] as const;
type ImageSize = (typeof IMAGE_SIZES)[number]["value"];

const SizedImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      size: {
        default: "medium",
        parseHTML: (el) => el.getAttribute("data-size") || "medium",
        renderHTML: (attrs) => ({ "data-size": attrs.size }),
      },
    };
  },
});

// Block images, no base64 (uploads go to Cloudinary). Both lists are built
// once here: a new array on each render would make TipTap reconfigure.
const imageExtensions = [...baseExtensions, SizedImage.configure({ inline: false, allowBase64: false })];

/** Select the image just inserted, so its size buttons are ready to use. */
function selectImage(editor: Editor, src: string) {
  let found = -1;
  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === "image" && node.attrs.src === src) found = pos;
  });
  if (found >= 0) editor.commands.setNodeSelection(found);
}

export default function RichTextEditor({
  initialHtml,
  onChange,
  imageFolder,
  ariaLabel = "Contenu de la page",
}: {
  initialHtml: string;
  onChange: (html: string) => void;
  // Set to enable the "Image" button; uploads go to this Cloudinary folder.
  imageFolder?: UploadFolder;
  ariaLabel?: string;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [imageProgress, setImageProgress] = useState<number | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: imageFolder ? imageExtensions : baseExtensions,
    content: initialHtml,
    // Rendered client-side only: avoids a server/client markup mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text min-h-80 px-4 py-4 text-base text-ink outline-none",
        "aria-label": ariaLabel,
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  });

  // useEditorState only refreshes on an editor transaction, and none happens
  // when the editor finishes mounting — so it can still be null here even
  // though the editor exists. Never gate rendering on it; fall back to
  // "nothing active" until the first edit or selection change.
  const toolbarState = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            h2: editor.isActive("heading", { level: 2 }),
            h3: editor.isActive("heading", { level: 3 }),
            bold: editor.isActive("bold"),
            italic: editor.isActive("italic"),
            underline: editor.isActive("underline"),
            bulletList: editor.isActive("bulletList"),
            orderedList: editor.isActive("orderedList"),
            link: editor.isActive("link"),
            image: editor.isActive("image") ? (editor.getAttributes("image").size as ImageSize) : null,
            canUndo: editor.can().undo(),
            canRedo: editor.can().redo(),
          }
        : null,
  });

  if (!editor) {
    return <div className="min-h-80 rounded border border-ink/20 bg-white" />;
  }
  const state = toolbarState ?? INACTIVE_TOOLBAR;

  const chain = () => editor.chain().focus();

  return (
    <div className="rounded border border-ink/20 bg-white focus-within:border-ink">
      <div
        role="toolbar"
        aria-label="Mise en forme"
        className="flex flex-wrap gap-2 border-b border-ink/10 p-2"
      >
        <ToolbarButton
          label="Titre"
          title="Titre de section"
          active={state.h2}
          onClick={() => chain().toggleHeading({ level: 2 }).run()}
        />
        <ToolbarButton
          label="Sous-titre"
          title="Sous-titre"
          active={state.h3}
          onClick={() => chain().toggleHeading({ level: 3 }).run()}
        />
        <ToolbarButton
          label={<strong>G</strong>}
          title="Gras"
          active={state.bold}
          onClick={() => chain().toggleBold().run()}
        />
        <ToolbarButton
          label={<em>I</em>}
          title="Italique"
          active={state.italic}
          onClick={() => chain().toggleItalic().run()}
        />
        <ToolbarButton
          label={<span className="underline">S</span>}
          title="Souligné"
          active={state.underline}
          onClick={() => chain().toggleUnderline().run()}
        />
        <ToolbarButton
          label="• Liste"
          title="Liste à puces"
          active={state.bulletList}
          onClick={() => chain().toggleBulletList().run()}
        />
        <ToolbarButton
          label="1. Liste"
          title="Liste numérotée"
          active={state.orderedList}
          onClick={() => chain().toggleOrderedList().run()}
        />
        <ToolbarButton
          label="Lien"
          title={state.link ? "Modifier ou retirer le lien" : "Ajouter un lien"}
          active={state.link}
          onClick={() => editLink(editor)}
        />
        <ToolbarButton
          label="↶"
          title="Annuler"
          disabled={!state.canUndo}
          onClick={() => chain().undo().run()}
        />
        <ToolbarButton
          label="↷"
          title="Rétablir"
          disabled={!state.canRedo}
          onClick={() => chain().redo().run()}
        />
        {imageFolder ? (
          <>
            <ToolbarButton
              label={imageProgress !== null ? `Image… ${imageProgress} %` : "Image"}
              title="Insérer une image"
              disabled={imageProgress !== null}
              onClick={() => fileInput.current?.click()}
            />
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const original = e.target.files?.[0];
                e.target.value = "";
                if (!original) return;
                if (!looksLikeImage(original)) {
                  setImageError("Ce fichier n’est pas une image.");
                  return;
                }
                setImageError(null);
                setImageProgress(0);
                try {
                  const file = await prepareImageForUpload(original);
                  const src = await uploadImage(file, imageFolder, setImageProgress);
                  const alt =
                    window.prompt("Description de l’image (lue par les lecteurs d’écran) :", "")?.trim() ?? "";
                  editor.chain().focus().setImage({ src, alt }).run();
                  selectImage(editor, src);
                } catch (err) {
                  setImageError(
                    err instanceof ImagePreparationError || err instanceof UploadError
                      ? err.message
                      : "Échec du téléversement. Vérifiez votre connexion et réessayez."
                  );
                } finally {
                  setImageProgress(null);
                }
              }}
            />
          </>
        ) : null}
      </div>
      {imageFolder ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 px-2 py-2">
          <span className="px-2 text-sm text-ink/60">Taille de l&rsquo;image :</span>
          {state.image ? (
            IMAGE_SIZES.map(({ value, label }) => (
              <ToolbarButton
                key={value}
                label={label}
                title={`Image ${label.toLowerCase()}`}
                active={state.image === value}
                onClick={() => chain().updateAttributes("image", { size: value }).run()}
              />
            ))
          ) : (
            <span className="text-sm leading-10 text-ink/40">touchez une image du texte pour la régler</span>
          )}
        </div>
      ) : null}
      {imageError ? <p className="border-b border-ink/10 px-4 py-2 text-sm text-red-700">{imageError}</p> : null}
      <EditorContent editor={editor} />
    </div>
  );
}
