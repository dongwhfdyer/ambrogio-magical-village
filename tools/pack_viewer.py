"""Rebuild the standalone viewer's scene from Ambrogio.glb (requires Pillow and NumPy)."""
import base64
import gzip
import io
import json
import re
import struct
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
raw = (ROOT / "Ambrogio.glb").read_bytes()
json_size = struct.unpack_from("<I", raw, 12)[0]
scene = json.loads(raw[20:20 + json_size])
source_views = scene["bufferViews"]
source_accessors = scene["accessors"]
scene["bufferViews"], scene["accessors"] = [], []
binary = bytearray()


def source_bytes(view_id):
    view = source_views[view_id]
    start = 28 + json_size + view.get("byteOffset", 0)
    return raw[start:start + view["byteLength"]]


def add_view(data):
    binary.extend(bytes(-len(binary) % 4))
    scene["bufferViews"].append({"buffer": 0, "byteOffset": len(binary), "byteLength": len(data)})
    binary.extend(data)
    return len(scene["bufferViews"]) - 1


for image in scene["images"]:
    data = source_bytes(image["bufferView"])
    if image["mimeType"] == "image/png":
        pixels = Image.open(io.BytesIO(data)).convert("RGBA")
        if pixels.getchannel("A").getextrema()[0] == 255:
            output = io.BytesIO()
            pixels.convert("RGB").save(output, "JPEG", quality=85, optimize=True)
            if output.tell() < len(data):
                data = output.getvalue()
                image["mimeType"] = "image/jpeg"
    image["bufferView"] = add_view(data)

for mesh in scene["meshes"]:
    for primitive in mesh["primitives"]:
        attrs = primitive["attributes"]
        # The exported village uses one face normal per triangle. Three.js shades
        # those facets directly, so the player needs only the original vertices.
        normals = source_bytes(source_accessors[attrs.pop("NORMAL")]["bufferView"])
        triangles = np.frombuffer(normals, dtype="<f4").reshape(-1, 3, 3)
        if not (np.allclose(triangles[:, 0], triangles[:, 1]) and
                np.allclose(triangles[:, 0], triangles[:, 2])):
            raise ValueError(f"Smooth normals need to be preserved on {mesh['name']}")
        for key, index in attrs.items():
            accessor = source_accessors[index].copy()
            accessor["bufferView"] = add_view(source_bytes(accessor["bufferView"]))
            attrs[key] = len(scene["accessors"])
            scene["accessors"].append(accessor)

scene["buffers"] = [{"byteLength": len(binary)}]
binary.extend(bytes(-len(binary) % 4))
description = json.dumps(scene, separators=(",", ":")).encode()
description += b" " * (-len(description) % 4)
glb = (struct.pack("<4sIIII", b"glTF", 2, 28 + len(description) + len(binary), len(description), 0x4E4F534A)
       + description + struct.pack("<I4s", len(binary), b"BIN\0") + binary)
encoded = base64.b64encode(gzip.compress(glb, compresslevel=9, mtime=0)).decode()
viewer = ROOT / "Explore Ambrogio.html"
html, count = re.subn(r"const data=decodeBase64\('[^']+'\)", f"const data=decodeBase64('{encoded}')", viewer.read_text())
if count != 1:
    raise ValueError("Expected one embedded village scene")
viewer.write_text(html)
