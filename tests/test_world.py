"""Offline collision, parkour and keyboard-camera regression checks (Playwright + Chrome)."""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


def test_world(tmp_path):
    html = (ROOT / "Explore Ambrogio.html").read_text()
    hooks = """window.testWorld={position, ground, move, course, startCourse, advanceJump, pressJump,fly,
      galleries:g.meshes.find(m=>m.name==="Suspended galleries").extras.routes,
      pilot(x,y,z){piloting=true;broomClaim=1;position.set(x,y,z)},stopFlight(){piloting=false;broomClaim=0},
      step:()=>courseStep, airborne:()=>airborne, yaw:()=>yaw, camera:cam, facing:()=>facing,
      go(x,y,z,angle=0){airborne=false;onCanopy=false;position.set(x,y,z);yaw=facing=angle;view('Walk')},
      look:()=>cam.getWorldDirection(new THREE.Vector3()).toArray()};"""
    page_file = tmp_path / "village.html"
    page_file.write_text(html.replace("onresize=resize;resize();", hooks + "onresize=resize;resize();"))
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chrome", args=["--enable-unsafe-swiftshader"])
        page = browser.new_page(viewport={"width": 900, "height": 640})
        page.goto(page_file.as_uri())
        page.wait_for_function("!!window.testWorld")
        results = page.evaluate("""()=>{
          const w=testWorld, result={};
          for(const side of [-1,1]){
            w.go(-3,w.ground(-3,42),42);
            for(let i=0;i<60&&!w.airborne();i++)w.move(.08*side,0);
            result[side]=[Math.abs(w.position.x+3),w.airborne()];
          }
          return result;
        }""")
        for distance, falling in results.values():
            assert 1.4 < distance < 2.02 and not falling, results
        coverage = page.evaluate("""()=>{
          const w=testWorld, report={};
          // Drop onto real triangles outside the old walkable ellipse and onto the dam crest.
          for(const [name,x,z,start] of [['outer cliff',30,5,5],['dam crest',73,32,-39],['balcony',-8,-14.04,23]]){
            w.go(x,start,z);w.pressJump();
            for(let i=0;i<400&&w.airborne();i++)w.advanceJump(.01,0,0);
            report[name]=[w.position.y,w.position.x,w.airborne()];
          }
          w.pilot(-3,w.ground(-3,42)+.32,42);
          for(let i=0;i<90;i++)w.fly(.09,0,0);
          report.flightOffset=Math.abs(w.position.x+3);w.stopFlight();
          // Test an ascent from under a platform, where the head should meet its underside.
          const [,h,z]=w.course[4],x=w.course[4][0];w.go(x,h-2.45,z);w.pressJump();
          let peak=w.position.y;
          for(let i=0;i<70&&w.airborne();i++){w.advanceJump(.01,0,0);peak=Math.max(peak,w.position.y)}
          report.underside=peak-h;
          report.crossings=[];
          for(const gallery of w.galleries){
            for(const path of [gallery,[...gallery].reverse()]){
              w.go(...path[0]);
              let crossed=true;
              for(const [x,,z] of path.slice(1)){
                const dx=x-w.position.x,dz=z-w.position.z,n=Math.ceil(Math.hypot(dx,dz)/.06);
                for(let i=0;i<n&&!w.airborne();i++){w.move(dx/n,0);if(!w.airborne())w.move(0,dz/n)}
                if(w.airborne()||Math.hypot(w.position.x-x,w.position.z-z)>.22){crossed=false;break}
              }
              report.crossings.push(crossed);
            }
          }
          const route=[];w.startCourse();
          for(let j=1;j<w.course.length;j++){
            const [tx,,tz]=w.course[j];w.pressJump();
            for(let i=0;i<250&&w.airborne();i++){
              const dx=tx-w.position.x,dz=tz-w.position.z,f=Math.min(1,.049/(Math.hypot(dx,dz)||1));
              w.advanceJump(.01,dx*f,dz*f);
            }
            route.push(w.step());
          }
          report.route=route;return report;
        }""")
        assert coverage["outer cliff"][0] >= -.05 and coverage["outer cliff"][1] == 30
        assert -43.4 < coverage["dam crest"][0] < -42
        assert 20.9 <= coverage["balcony"][0] <= 22.3
        assert not any(coverage[name][2] for name in ("outer cliff", "dam crest", "balcony"))
        assert coverage["flightOffset"] < 2.05 and coverage["underside"] < -1.5
        assert coverage["crossings"] == [True]*10
        assert coverage["route"] == list(range(1, 16)), coverage

        page.evaluate("testWorld.go(-3,.34,13)")
        follow = page.get_by_role("button", name="Follow camera")
        follow.click()
        page.keyboard.down("d")
        page.wait_for_function("testWorld.yaw()<-.25")
        page.keyboard.up("d")
        assert page.evaluate("Math.abs(testWorld.yaw()-testWorld.facing())<.01 && testWorld.position.x===-3")
        for camera in ("eye", "rear", "front"):
            page.get_by_label("Walking camera").select_option(camera)
            for key, sign in (("ArrowUp", 1), ("ArrowDown", -1)):
                page.keyboard.down(key)
                page.wait_for_function(f"testWorld.look()[1]*{sign}>.99999999", timeout=10000)
                page.keyboard.up(key)
        page.reload()
        assert page.get_by_role("button", name="Follow camera").get_attribute("aria-pressed") == "true"
        browser.close()
