def test_markdown_upload_becomes_document(make_user):
    c = make_user("alice")
    r = c.post("/api/uploads", files={"file": ("notes.md", b"# Hi\n\n- a\n- b\n", "text/markdown")})
    assert r.status_code == 201
    assert r.json()["title"] == "notes"
    assert r.json()["content"]["content"][0]["type"] == "heading"


def test_unsupported_type_rejected(make_user):
    c = make_user("alice")
    assert c.post("/api/uploads", files={"file": ("x.exe", b"MZ", "application/octet-stream")}).status_code == 415


def test_oversized_file_rejected(make_user):
    c = make_user("alice")
    big = b"a" * 1_000_001
    assert c.post("/api/uploads", files={"file": ("big.txt", big, "text/plain")}).status_code == 413