module.exports=async page=>page.addInitScript(()=>{
 try{localStorage.setItem('obs-overlay-first-use','done');}catch{}
 // Existing editor tests start at the layout picker; first-use behavior is tested separately.
 let opened=false;
 const choose=()=>{const button=document.querySelector('#change-layout'),choice=document.querySelector('[data-layout-choice]');if(!opened&&button&&choice&&!choice.disabled){opened=true;setTimeout(()=>button.click(),0);}};
 new MutationObserver(choose).observe(document,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled']});
});
