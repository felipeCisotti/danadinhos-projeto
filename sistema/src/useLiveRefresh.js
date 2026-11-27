import {useEffect,useRef} from 'react';
import {supabase} from './supabase';

export function useLiveRefresh(area, refresh, blocked) {
  const latest=useRef(null);
  latest.current={refresh,blocked};
  useEffect(()=>{
    if(!supabase)return;
    let disposed=false,connected=false,running=false,pending=false,timer;
    function schedule(){
      if(disposed)return;
      pending=true;
      if(!timer&&!running&&!document.hidden)timer=setTimeout(flush,250);
    }
    async function flush(){
      timer=null;
      if(disposed||document.hidden||!pending)return;
      if(latest.current.blocked()){schedule();return;}
      pending=false;running=true;
      try{await latest.current.refresh();}
      finally{running=false;if(pending)schedule();}
    }
    const channel=supabase.channel('staff:'+area)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'staff_refresh_signals',filter:'area=eq.'+area},schedule)
      .subscribe(status=>{connected=status==='SUBSCRIBED';if(connected)schedule();});
    const fallback=setInterval(()=>{if(!connected)schedule();},30000);
    const onVisible=()=>{if(!document.hidden)schedule();};
    window.addEventListener('online',schedule);
    document.addEventListener('visibilitychange',onVisible);
    return ()=>{disposed=true;clearTimeout(timer);clearInterval(fallback);window.removeEventListener('online',schedule);document.removeEventListener('visibilitychange',onVisible);void supabase.removeChannel(channel);};
  },[area]);
}

