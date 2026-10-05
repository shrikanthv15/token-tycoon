// Nemotron Bridge – client side job generation with fallback
// Exported as window.NemotronBridge
(function(){
  const DEFAULT_ENDPOINT = '/api/generate-jobs';
  const TIMEOUT_MS = 3000;
  let NEMOTRON_ENABLED = false; // feature flag – can be toggled via setEnabled

function setEnabled(val){ NEMOTRON_ENABLED = !!val; }


  function validateJobs(jobs){
    if(!Array.isArray(jobs) || jobs.length>5) return false;
    for(const job of jobs){
      if(typeof job.title!=='string') return false;
      if(typeof job.stars!=='number' || job.stars<1 || job.stars>3) return false;
      if(typeof job.pay!=='number' || job.pay<0) return false;
    }
    return true;
  }

  async function requestJobs(worldSnapshot, endpoint=DEFAULT_ENDPOINT){
    if(!NEMOTRON_ENABLED) throw new Error('Nemotron disabled');
    const controller = new AbortController();
    const timeoutId = setTimeout(()=>controller.abort(), TIMEOUT_MS);
    try {
      const resp = await fetch(endpoint, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({model:'nemotron', messages:[{role:'system',content:'Generate job list'}, {role:'user',content:JSON.stringify(worldSnapshot)}]}),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      if(!resp.ok) throw new Error('Network error '+resp.status);
      const data = await resp.json();
      if(!validateJobs(data)) throw new Error('Invalid schema');
      return data;
    } catch(e){
      clearTimeout(timeoutId);
      throw e;
    }
  }

  // expose globally for game.js to use
  window.NemotronBridge = {requestJobs, isEnabled:()=>NEMOTRON_ENABLED, setEnabled};
})();
