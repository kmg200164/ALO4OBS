const test=require('node:test'),assert=require('node:assert/strict');
const api=require('../template/pack.js');
test('regional image choices preserve inactive sources and reject malformed modes',()=>{
 const region={imageMode:'none',image:'assets/image.png',imageFile:'assets/image.png',imageUrl:'https://example.org/image.png'};
 const input={regionBackgrounds:{custom1:region}};
 const saved=JSON.parse(new TextDecoder().decode(api.settingsEntries(input)[1].bytes));
 for(const key of Object.keys(region))assert.equal(saved.regionBackgrounds.custom1[key],region[key]);
 for(const invalid of [{imageMode:'invalid'},{imageUrl:'javascript:alert(1)'},{imageFile:'../outside.png'}])assert.throws(()=>api.settingsEntries({regionBackgrounds:{custom1:{...region,...invalid}}}));
});
