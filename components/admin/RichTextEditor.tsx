"use client";

import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

// Only what the public page renders (see lib/legal-html.ts allowlist).
const extensions = [
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

export default function RichTextEditor({
  initialHtml,
  onChange,
}: {
  initialHtml: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions,
    content: initialHtml,
    // Rendered client-side only: avoids a server/client markup mismatch.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "rich-text min-h-80 px-4 py-4 text-base text-ink outline-none",
        "aria-label": "Contenu de la page",
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
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
