import re

_INLINE = re.compile(r"(\*\*[^*\n]+\*\*|\*[^*\n]+\*)")


def _inline(text: str) -> list[dict]:
    nodes = []
    for part in _INLINE.split(text):
        if not part:
            continue
        if part.startswith("**") and part.endswith("**") and len(part) > 4:
            nodes.append({"type": "text", "text": part[2:-2], "marks": [{"type": "bold"}]})
        elif part.startswith("*") and part.endswith("*") and len(part) > 2:
            nodes.append({"type": "text", "text": part[1:-1], "marks": [{"type": "italic"}]})
        else:
            nodes.append({"type": "text", "text": part})
    return nodes


def _node(kind: str, text: str, **attrs) -> dict:
    node: dict = {"type": kind}
    content = _inline(text)
    if content:
        node["content"] = content
    if attrs:
        node["attrs"] = attrs
    return node


def _item(text: str) -> dict:
    return {"type": "listItem", "content": [_node("paragraph", text)]}


def text_to_doc(raw: str) -> dict:
    blocks: list[dict] = []
    bullets: list[str] = []
    numbered: list[str] = []

    def flush() -> None:
        if bullets:
            blocks.append({"type": "bulletList", "content": [_item(t) for t in bullets]})
            bullets.clear()
        if numbered:
            blocks.append({"type": "orderedList", "content": [_item(t) for t in numbered]})
            numbered.clear()

    for line in raw.splitlines():
        s = line.strip()
        if m := re.match(r"^(#{1,3})\s+(.*)", s):
            flush()
            blocks.append(_node("heading", m.group(2), level=len(m.group(1))))
        elif m := re.match(r"^[-*+]\s+(.*)", s):
            if numbered:
                flush()
            bullets.append(m.group(1))
        elif m := re.match(r"^\d+[.)]\s+(.*)", s):
            if bullets:
                flush()
            numbered.append(m.group(1))
        elif s:
            flush()
            blocks.append(_node("paragraph", s))
        else:
            flush()
    flush()
    return {"type": "doc", "content": blocks}