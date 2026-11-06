import os,sys,runpy
from pathlib import Path
# Preserve Library attributes as NTFS named streams on Windows.
def set_attr(path,name,value,*args,**kwargs):
    Path(str(path)+":"+str(name)).write_bytes(value)
def get_attr(path,name,*args,**kwargs):
    return Path(str(path)+":"+str(name)).read_bytes()
if not hasattr(os,"setxattr"):
    os.setxattr=set_attr
    os.getxattr=get_attr
helper=str(Path(__file__).with_name("library_file_transfer.py"))
sys.argv=[helper]+sys.argv[1:]
runpy.run_path(helper,run_name="__main__")

