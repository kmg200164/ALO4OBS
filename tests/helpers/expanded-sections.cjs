module.exports=async page=>page.addInitScript(()=>{
 // Control fixtures expose sections after each editor render; startup behavior has its own test.
 const expand=()=>document.querySelectorAll('details.property-section:not([open])').forEach(section=>section.open=true);
 new MutationObserver(expand).observe(document,{childList:true,subtree:true});
});
