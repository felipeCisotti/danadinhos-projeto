import React from 'react';

export default class AppBoundary extends React.Component {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  componentDidCatch(error,info){console.error('Falha ao abrir o sistema Danadinhos:',error,info.componentStack);}
  render(){
    if(this.state.failed)return <div role="alert" style={{maxWidth:560,margin:'64px auto',padding:28,fontFamily:'system-ui,sans-serif',background:'#fff',border:'1px solid #ddd',borderRadius:16,color:'#273047'}}><h1 style={{fontSize:26}}>Não foi possível abrir esta tela</h1><p>Recarregue o sistema para tentar novamente. Se continuar, informe em qual perfil a falha aconteceu.</p><button type="button" onClick={()=>window.location.reload()} style={{padding:'12px 18px',border:0,borderRadius:8,background:'#35624b',color:'#fff',cursor:'pointer'}}>Recarregar sistema</button></div>;
    return this.props.children;
  }
}
