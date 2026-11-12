"use client";

import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

function Btn({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "min-w-8 rounded px-2 py-1 text-sm hover:bg-neutral-100",
        active && "bg-neutral-900 text-white hover:bg-neutral-800",
      )}
    >
      {children}
    </button>
  );
}

export function Toolbar({ editor }: { editor: Editor }) {
  const s = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      underline: ctx.editor.isActive("underline"),
      h1: ctx.editor.isActive("heading", { level: 1 }),
      h2: ctx.editor.isActive("heading", { level: 2 }),
      h3: ctx.editor.isActive("heading", { level: 3 }),
      bullet: ctx.editor.isActive("bulletList"),
      ordered: ctx.editor.isActive("orderedList"),
    }),
  });
  const c = () => editor.chain().focus();

  return (
    <div className="flex flex-wrap items-center gap-1 rounded border border-neutral-200 p-1">
      <Btn label="Bold" active={s.bold} onClick={() => c().toggleBold().run()}>
        <b>B</b>
      </Btn>
      <Btn label="Italic" active={s.italic} onClick={() => c().toggleItalic().run()}>
        <i>I</i>
      </Btn>
      <Btn label="Underline" active={s.underline} onClick={() => c().toggleUnderline().run()}>
        <u>U</u>
      </Btn>
      <span className="mx-1 h-5 w-px bg-neutral-200" />
      <Btn label="Heading 1" active={s.h1} onClick={() => c().toggleHeading({ level: 1 }).run()}>
        H1
      </Btn>
      <Btn label="Heading 2" active={s.h2} onClick={() => c().toggleHeading({ level: 2 }).run()}>
        H2
      </Btn>
      <Btn label="Heading 3" active={s.h3} onClick={() => c().toggleHeading({ level: 3 }).run()}>
        H3
      </Btn>
      <span className="mx-1 h-5 w-px bg-neutral-200" />
      <Btn label="Bulleted list" active={s.bullet} onClick={() => c().toggleBulletList().run()}>
        • List
      </Btn>
      <Btn label="Numbered list" active={s.ordered} onClick={() => c().toggleOrderedList().run()}>
        1. List
      </Btn>
    </div>
  );
}
