"""Run source framing in OBS LuaJIT without modifying the original source."""
import unittest
import test_overlap_obs as obs_tests

@unittest.skipUnless(obs_tests.DLL.exists(), 'OBS LuaJIT is not installed')
class SourceViewTests(unittest.TestCase):
    run_lua=obs_tests.OverlapObsTests.run_lua
    def test_source_view_applies_saved_crop_fit_and_resets_without_changing_original(self):
        source=obs_tests.SOURCE.read_text(encoding='utf-8')
        marker='local function apply_source_view('
        helper=source[source.index(marker):source.index('local function clip(')] if marker in source else ''
        self.run_lua(r"""
obs={OBS_BOUNDS_SCALE_INNER=1,OBS_BOUNDS_SCALE_OUTER=2,OBS_BOUNDS_STRETCH=3}
function obs.obs_sceneitem_crop() return {} end
function obs.obs_sceneitem_set_crop(item,crop) item.crop=crop end
function obs.obs_sceneitem_set_bounds_type(item,fit) item.fit=fit end
"""+helper+r"""
assert(type(apply_source_view)=='function','HTML source crop and fit are not applied in OBS')
local original={width=500,height=160};local sentinel={source=original,crop={left=9}}
local item={source=original}
apply_source_view(item,{fit='cover',crop={left=0,top=0,right=60,bottom=30}})
assert(item.fit==2 and item.crop.right==60 and item.crop.bottom==30)
assert(original.width==500 and original.height==160 and sentinel.crop.left==9)
apply_source_view(item,nil)
assert(item.fit==1 and item.crop.left==0 and item.crop.right==0 and item.crop.top==0 and item.crop.bottom==0)
""")
