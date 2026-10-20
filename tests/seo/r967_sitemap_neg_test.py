import importlib.util, sys, io, contextlib
spec = importlib.util.spec_from_file_location("shc", "/home/junze/gamezipper.com/scripts/seo_health_check.py")
shc = importlib.util.module_from_spec(spec); spec.loader.exec_module(shc)
PORT = int(sys.argv[1]); NAME = sys.argv[2]
shc.SITES = {NAME: f"http://127.0.0.1:{PORT}"}
shc.INDEXNOW_KEYS = {NAME: "testkey"}
buf = io.StringIO()
with contextlib.redirect_stdout(buf):
    rc = shc.main()
print(f"### MODE={sys.argv[3]} site={NAME} rc={rc}")
print(buf.getvalue().strip()[-500:])
