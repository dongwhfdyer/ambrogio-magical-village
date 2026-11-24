"""Check the compact touch layout at narrow portrait and landscape sizes."""
import re
from pathlib import Path

from playwright.sync_api import sync_playwright


def test_phone_navigation():
    url = (Path(__file__).resolve().parents[1] / "Explore Ambrogio.html").as_uri()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", args=["--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width": 320, "height": 568}, is_mobile=True, has_touch=True)
        page.goto(url)
        menu = page.get_by_role("button", name="Explore", exact=True)
        forward = page.get_by_role("button", name="Walk forward")
        for width, height in [(320, 568), (844, 390)]:
            page.set_viewport_size({"width": width, "height": height})
            forward.wait_for()
            assert menu.get_attribute("aria-expanded") == "false"
            assert not page.locator("nav").is_visible()
            assert page.evaluate("document.elementFromPoint(innerWidth/2,innerHeight/2).tagName") == "CANVAS"
            assert page.evaluate("document.documentElement.scrollWidth") == width
            for control in page.locator("aside button:visible").all():
                box = control.bounding_box()
                assert box["width"] >= 44 and box["height"] >= 44
                assert 0 <= box["x"] <= width-box["width"] and height-104 <= box["y"] <= height-box["height"]
            destination = page.get_by_role("button", name="Golden island", exact=True)
            menu.tap()
            destination.tap()
            assert menu.get_attribute("aria-expanded") == "false" and not forward.is_visible()
            menu.tap()
            page.get_by_role("button", name="Walk", exact=True).tap()
            forward.wait_for()
            menu.tap()
            page.get_by_role("button", name=re.compile(r"^(Spawn|Pilot) balloon$")).tap()
            page.get_by_role("button", name="Rise", exact=True).tap()
            assert not page.get_by_role("button", name="Hold to run").is_visible()
            menu.tap()
            page.get_by_role("button", name="Step out", exact=True).tap()
            forward.wait_for()
        browser.close()
