import LogoPrincipal from '/src/assets/danadinhos-logo-transparente.png'
import BannerPrincipal from '/src/assets/banner-principal.png'
import SobreFoto from '/src/assets/sec-sobre/DanadinhosFachada.png'
import { useEffect, useRef, useState } from 'react'
import './App.css'
import WelcomeIntro from './WelcomeIntro'

import FestaAlmoco from '/src/assets/sec-festas/almoco.png'
import FestaColegial from '/src/assets/sec-festas/colegial.png'
import FestaCoquetel from '/src/assets/sec-festas/coquetel.png'
import FestaEscolar from '/src/assets/sec-festas/escolar.png'
import FestaMacarrao from '/src/assets/sec-festas/macarrao.png'

import LocalSalao from './assets/sec-local/salao-festas.webp'
import LocalTrampolim from './assets/sec-local/trampolim-park.webp'
import LocalBaby from './assets/sec-local/area-baby.webp'
import LocalJogos from './assets/sec-local/jogos.webp'
import LocalQuadra from './assets/sec-local/quadra.webp'
import LocalCriancas from './assets/sec-local/criancas-brincando.webp'

const WHATSAPP_NUMBER = '5516997218967'



function App() {
  const carouselRef = useRef(null)
  const carouselAnimationFrameRef = useRef(null)
  const headerLogoRef = useRef(null)
  const orcamentoDialogRef = useRef(null)
  const simuladorDialogRef = useRef(null)
  const [introPlaying, setIntroPlaying] = useState(true)
  const [introBlocking, setIntroBlocking] = useState(true)
  const [festaSelecionada, setFestaSelecionada] = useState(null)
  const [simuladorAberto, setSimuladorAberto] = useState(false)
  const [preferencias, setPreferencias] = useState({ tipo: 2, convidados: 50, dia: 'semana' })

  const carouselImages = [
    {
      src: FestaAlmoco,
      alt: "Festa Almoço",
      title: "Almoço ou jantar",
      theme: '#8b0aa6',
      description: 'Pacote completo para uma celebração especial com almoço ou jantar.',
      guests: '50 pessoas',
      baseGuests: 50,
      basePrice: 11000,
      weekendPrice: 11250,
      extraPrice: 110,
      duration: '4 horas',
      availability: 'Segunda a sábado, exceto domingos e feriados',
      price: 'A partir de R$ 11.000,00',
      extra: 'Convidados extras a partir de R$ 110,00',
      details: ['1 tipo de salada, arroz e acompanhamento', '1 escondidinho, 1 tipo de carne e 1 tipo de massa', '1 tipo de bolo com sorvete', 'Refrigerantes tradicionais e zero, água e suco', 'Arco de balões na entrada e decoração de 5 metros'],
    },
    {
      src: FestaColegial,
      alt: "Festa Colegial",
      title: "Festa colegial",
      theme: '#f34b91',
      description: 'Um pacote completo para comemorar com a turma, com música e recreação.',
      guests: '50 pessoas a partir de 6 anos',
      baseGuests: 50,
      basePrice: 10250,
      extraPrice: null,
      duration: '4 horas',
      availability: 'Conforme disponibilidade de agenda',
      price: 'R$ 10.250,00',
      extra: 'Mais um salgado: R$ 3,50 por pessoa',
      details: ['3 tipos de salgados e 3 tipos de lanches', 'Fritas e nuggets no aparador das crianças', '4 tipos de doces e 1 sabor de patê com torradas', '2 sabores de batidinhas', 'Recreadores durante 2 horas e música ao vivo'],
    },
    {
      src: FestaCoquetel,
      alt: "Festa Coquetel",
      title: "Festa coquetel",
      theme: '#2f9e12',
      description: 'Nosso pacote campeão de vendas, com recreação, música e um cardápio completo.',
      guests: '50 pessoas',
      baseGuests: 50,
      basePrice: 8300,
      weekendPrice: 9300,
      extraPrice: 85,
      duration: '4 horas',
      availability: 'Todos os dias da semana',
      price: 'R$ 8.300,00 (R$ 9.300,00 aos domingos e feriados)',
      extra: 'Convidados extras: R$ 85,00',
      details: ['10 tipos de salgados, incluindo lanches', 'Nuggets e fritas no aparador das crianças', '4 tipos de doces, 2 sabores de patê e 2 sabores de batidinhas', '1 tipo de bolo, refrigerantes, água e suco', 'Recreadores por 2 horas, arco de balões e decoração de 5 metros'],
    },
    {
      src: FestaEscolar,
      alt: "Festa Escolar",
      title: "Festa escolar",
      theme: '#f5ad00',
      description: 'Uma comemoração prática e divertida para eventos escolares.',
      guests: '30 pessoas',
      baseGuests: 30,
      basePrice: 4870,
      extraPrice: 65,
      duration: '3 horas',
      availability: 'Segunda a quinta, exceto feriados e vésperas',
      price: 'R$ 4.870,00',
      extra: 'Convidados extras: R$ 65,00 por pessoa',
      details: ['1 sabor de patê com torradas', '5 tipos de salgados, incluindo lanches', 'Nuggets e fritas no aparador das crianças', '2 tipos de doces e 1 tipo de bolo', 'Refrigerantes tradicionais e zero, água, suco e decoração de 3 metros'],
      note: 'Crianças de 0 a 2 anos não contam.',
    },
    {
      src: FestaMacarrao,
      alt: "Festa Macarrão",
      title: "Festa macarrão",
      theme: '#fa4b0a',
      description: 'Uma festa saborosa com massas preparadas na hora e acompanhamentos variados.',
      guests: '50 pessoas',
      baseGuests: 50,
      basePrice: 6900,
      extraPrice: 65,
      duration: '3 horas',
      availability: 'Segunda a quinta, exceto feriados e vésperas',
      price: 'R$ 6.900,00',
      extra: 'Convidados extras: R$ 65,00 por pessoa',
      details: ['1 sabor de patê com torradas', '7 tipos de salgados, incluindo lanches', 'Nuggets e fritas no aparador das crianças', '2 tipos de doces e 1 tipo de bolo', 'Refrigerantes tradicionais e zero, água, suco e decoração de 3 metros'],
      note: 'Pista com massa, 2 molhos e 8 acompanhamentos preparados na frigideira ao vivo.',
    }
  ];

  useEffect(() => {
    const dialog = orcamentoDialogRef.current
    if (!dialog) return

    if (festaSelecionada && !dialog.open) {
      dialog.showModal()
    } else if (!festaSelecionada && dialog.open) {
      dialog.close()
    }
  }, [festaSelecionada])

  useEffect(() => {
    const dialog = simuladorDialogRef.current
    if (!dialog) return

    if (simuladorAberto && !dialog.open) {
      dialog.showModal()
    } else if (!simuladorAberto && dialog.open) {
      dialog.close()
    }
  }, [simuladorAberto])

  const localImages = [
    { src: LocalSalao, alt: 'Salão com mesas preparadas e decoração de balões', title: 'Tudo pronto para celebrar', description: 'Um salão acolhedor, preparado nos detalhes para receber sua família e transformar cada encontro em uma grande comemoração.' },
    { src: LocalTrampolim, alt: 'Crianças no espaço de camas elásticas e piscina de espuma', title: 'Energia que vira diversão', description: 'No Trampolim Park, a criançada pula, explora e gasta energia em uma experiência cheia de movimento.' },
    { src: LocalBaby, alt: 'Área baby com brinquedo de nave, mini cozinha e oficina', title: 'Um cantinho para imaginar', description: 'Um espaço seguro e colorido para os pequenos brincarem, criarem histórias e descobrirem novas aventuras.' },
    { src: LocalJogos, alt: 'Máquinas de jogos eletrônicos e mesa de air game', title: 'Desafios para todas as idades', description: 'Jogos eletrônicos, air game e muita interação para compartilhar disputas divertidas e boas risadas.' },
    { src: LocalQuadra, alt: 'Quadra de futebol cercada por redes, ao lado do escorregador', title: 'Brincadeira em movimento', description: 'Uma quadra para correr, jogar em equipe e deixar a imaginação conduzir cada nova brincadeira.' },
    { src: LocalCriancas, alt: 'Três crianças sentadas em um brinquedo colorido, com adesivos nos rostos', title: 'Memórias feitas brincando', description: 'Porque os melhores momentos acontecem quando a diversão é compartilhada e vira história para contar.' },
  ];
  const [activeLocalIndex, setActiveLocalIndex] = useState(0);
  const [localCarouselPaused, setLocalCarouselPaused] = useState(false);

  useEffect(() => {
    if (localCarouselPaused) return undefined;

    const interval = window.setInterval(() => {
      setActiveLocalIndex((currentIndex) => (currentIndex + 1) % localImages.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [localCarouselPaused, localImages.length]);

  const scrollCarousel = (direction) => {
    const carousel = carouselRef.current;
    if (!carousel) return;
    const itemWidth = carousel.children[0].getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(carousel).columnGap) || 0;
    const maxScroll = carousel.scrollWidth - carousel.clientWidth;
    let target = carousel.scrollLeft + direction * (itemWidth + gap);
    if (direction > 0 && carousel.scrollLeft >= maxScroll - 2) target = 0;
    if (direction < 0 && carousel.scrollLeft <= 2) target = maxScroll;
    carousel.scrollTo({
      left: target,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  };

  const animateFestaCards = () => {
    if (carouselAnimationFrameRef.current) return

    carouselAnimationFrameRef.current = window.requestAnimationFrame(() => {
      const carousel = carouselRef.current
      if (!carousel) {
        carouselAnimationFrameRef.current = null
        return
      }

      const center = carousel.scrollLeft + carousel.clientWidth / 2
      Array.from(carousel.children).forEach((card) => {
        const cardCenter = card.offsetLeft + card.offsetWidth / 2
        const distance = Math.min(Math.abs(center - cardCenter) / carousel.clientWidth, 1)
        const scale = 1 - distance * 0.1
        const rotation = (cardCenter - center) / carousel.clientWidth * 4
        const opacity = 1 - distance * 0.18

        card.style.setProperty('--scroll-scale', scale.toFixed(3))
        card.style.setProperty('--scroll-rotation', `${rotation.toFixed(2)}deg`)
        card.style.setProperty('--scroll-opacity', opacity.toFixed(3))
      })

      carouselAnimationFrameRef.current = null
    })
  }

  useEffect(() => () => {
    if (carouselAnimationFrameRef.current) {
      window.cancelAnimationFrame(carouselAnimationFrameRef.current)
    }
  }, [])

  const handleScrollToContent = (e) => {
    e.preventDefault()
    const element = document.getElementById('conheca')
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
  }

  const pacoteParaCalculo = carouselImages[Number(preferencias.tipo)] || carouselImages[0]
  const quantidadeConvidados = Math.max(1, Number(preferencias.convidados) || pacoteParaCalculo.baseGuests)
  const convidadosExtras = Math.max(0, quantidadeConvidados - pacoteParaCalculo.baseGuests)
  const valorBase = preferencias.dia === 'domingo' && pacoteParaCalculo.weekendPrice
    ? pacoteParaCalculo.weekendPrice
    : pacoteParaCalculo.basePrice
  const valorExtras = pacoteParaCalculo.extraPrice === null
    ? null
    : convidadosExtras * pacoteParaCalculo.extraPrice
  const valorEstimado = valorExtras === null ? valorBase : valorBase + valorExtras
  const formatarMoeda = (valor) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  const mensagemOrcamento = [
    'Olá, equipe Danadinhos!',
    '',
    'Quero confirmar o orçamento da minha festa.',
    `Tipo de festa: ${pacoteParaCalculo.title}`,
    `Convidados: ${quantidadeConvidados}`,
    `Período: ${preferencias.dia === 'domingo' ? 'domingo ou feriado' : 'durante a semana'}`,
    `Estimativa: ${formatarMoeda(valorEstimado)}`,
    '',
    'Podem me enviar os próximos passos, por favor?',
  ].join('\n')
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagemOrcamento)}`

  return (
    <div className={`page${introPlaying ? ' intro-playing' : ''}`}>
      {introPlaying && <WelcomeIntro targetRef={headerLogoRef} onComplete={setIntroPlaying} onUnlock={setIntroBlocking} />}
      <header className='header-page' inert={introPlaying && introBlocking}>
        <a href="/" className='logo-link' aria-label="Página Inicial Danadinhos">
          <img
            src={LogoPrincipal}
            ref={headerLogoRef}
            alt="Danadinhos - A vida é uma festa"
            className='logo-principal'
          />
        </a>
        <nav className='header-nav' aria-label='Navegação principal'>
          <a href='#conheca'>
            <svg viewBox='0 0 24 24' aria-hidden='true'><circle cx='12' cy='8' r='3' /><path d='M5 20c.7-3.2 3.1-5 7-5s6.3 1.8 7 5' /></svg>
            Conheça
          </a>
          <a href='#local'>
            <svg viewBox='0 0 24 24' aria-hidden='true'><path d='M4 10.5 12 4l8 6.5' /><path d='M6.5 9.5V20h11V9.5M9.5 20v-6h5v6' /></svg>
            Nosso espaço
          </a>
          <a href='#endereco'>
            <svg viewBox='0 0 24 24' aria-hidden='true'><path d='M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z' /><circle cx='12' cy='10' r='2.5' /></svg>
            Localização
          </a>
        </nav>
        <button type='button' className='header-orcamento-btn' onClick={() => setSimuladorAberto(true)}>
          Solicitar orçamento
        </button>
      </header>

      <main className='main-page' inert={introPlaying && introBlocking}>
        <section className='hero-section' aria-label='Boas-vindas ao Danadinhos'>
          <div className='hero-mobile'>
            <div className='hero-mobile-texto'>
              <h1>Onde a diversão <span>vira memória!</span></h1>
              <p>Um espaço pensado para celebrar momentos especiais, com muita diversão, carinho e alegria para a criançada.</p>
              <a href='#conheca' className='hero-mobile-btn' onClick={handleScrollToContent}>Conheça o Danadinhos</a>
            </div>
            <div className='hero-mobile-arte' style={{ backgroundImage: `url(${BannerPrincipal})` }} aria-hidden='true' />
          </div>
          <div className='banner-wrapper'>
            <img
              src={BannerPrincipal}
              alt="Onde a diversão vira memória! Danadinhos - A vida é uma festa"
              className='banner-principal'
            />

            <a
              href="#conheca"
              className='btn-conheca-hotspot'
              onClick={handleScrollToContent}
              aria-label="Conheça o Danadinhos"
            />
          </div>
        </section>


        <section className='lista-festas'>
          <div className='lista-festas-container'>
            <button className='carousel-btn left-btn' onClick={() => scrollCarousel(-1)} aria-label="Anterior">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <div className='lista-festas-carroussel' ref={carouselRef} onScroll={animateFestaCards} tabIndex={0} role='region' aria-label='Tipos de festas; deslize para ver mais'>
              {carouselImages.map((img, index) => (
                <button
                  type='button'
                  className='festa-card'
                  key={index}
                  onClick={() => setFestaSelecionada(img)}
                  style={{ '--festa-cor': img.theme }}
                  aria-label={`Ver detalhes: ${img.title}`}
                >
                  <img src={img.src} alt={img.alt} />
                  <span>Ver detalhes</span>
                </button>
              ))}
            </div>
            <button className='carousel-btn right-btn' onClick={() => scrollCarousel(1)} aria-label="Próximo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
          <dialog
            ref={orcamentoDialogRef}
            className='orcamento-dialog'
            aria-labelledby='orcamento-titulo'
            style={festaSelecionada ? { '--festa-cor': festaSelecionada.theme } : undefined}
            onClose={() => setFestaSelecionada(null)}
            onClick={(event) => {
              if (event.target === event.currentTarget) setFestaSelecionada(null)
            }}
          >
            {festaSelecionada && (
              <div className='orcamento-conteudo'>
                <button
                  type='button'
                  className='orcamento-fechar'
                  onClick={() => setFestaSelecionada(null)}
                  aria-label='Fechar orçamento'
                >
                  &times;
                </button>
                <img src={festaSelecionada.src} alt={festaSelecionada.alt} />
                <div>
                  <p className='orcamento-legenda'>Detalhes da festa</p>
                  <h2 id='orcamento-titulo'>{festaSelecionada.title}</h2>
                  <p className='orcamento-descricao'>{festaSelecionada.description}</p>
                  <div className='orcamento-resumo'>
                    <strong>{festaSelecionada.guests}</strong>
                    <strong>{festaSelecionada.duration}</strong>
                    <strong>{festaSelecionada.price}</strong>
                  </div>
                  <p className='orcamento-disponibilidade'>{festaSelecionada.availability}</p>
                  <ul className='orcamento-detalhes'>
                    {festaSelecionada.details.map((detail) => <li key={detail}>{detail}</li>)}
                  </ul>
                  <p className='orcamento-extra'>{festaSelecionada.extra}</p>
                  {festaSelecionada.note && <p className='orcamento-nota'>{festaSelecionada.note}</p>}
                </div>
              </div>
            )}
          </dialog>
        </section>

        <dialog
          ref={simuladorDialogRef}
          className='simulador-dialog'
          aria-labelledby='simulador-titulo'
          onClose={() => setSimuladorAberto(false)}
          onClick={(event) => {
            if (event.target === event.currentTarget) setSimuladorAberto(false)
          }}
        >
          <div className='simulador-conteudo'>
            <button
              type='button'
              className='orcamento-fechar'
              onClick={() => setSimuladorAberto(false)}
              aria-label='Fechar simulador de orçamento'
            >
              &times;
            </button>
            <p className='orcamento-legenda'>Planeje sua festa</p>
            <h2 id='simulador-titulo'>Monte seu orçamento</h2>
            <p className='simulador-intro'>Escolha suas preferências e veja uma estimativa do pacote.</p>

            <div className='simulador-form'>
              <label>
                Tipo de festa
                <select
                  value={preferencias.tipo}
                  onChange={(event) => setPreferencias({ ...preferencias, tipo: event.target.value })}
                >
                  {carouselImages.map((festa, index) => <option value={index} key={festa.title}>{festa.title}</option>)}
                </select>
              </label>
              <label>
                Quantidade de convidados
                <input
                  type='number'
                  min='1'
                  value={preferencias.convidados}
                  onChange={(event) => setPreferencias({ ...preferencias, convidados: event.target.value })}
                />
              </label>
              <label>
                Quando será a festa?
                <select
                  value={preferencias.dia}
                  onChange={(event) => setPreferencias({ ...preferencias, dia: event.target.value })}
                >
                  <option value='semana'>Durante a semana</option>
                  <option value='domingo'>Domingo ou feriado</option>
                </select>
              </label>
            </div>

            <div className='simulador-resultado' style={{ '--festa-cor': pacoteParaCalculo.theme }}>
              <span>Estimativa para {quantidadeConvidados} convidados</span>
              <strong>{formatarMoeda(valorEstimado)}</strong>
              {valorExtras > 0 && <small>Inclui {convidadosExtras} convidado(s) extra(s).</small>}
              {valorExtras === null && <small>Convidados extras devem ser confirmados com a equipe.</small>}
            </div>
            <p className='simulador-nota'>Valor sujeito à confirmação de disponibilidade, data e detalhes do evento.</p>
          </div>
        </dialog>

        <section id='conheca' className='sobre-section'>

          <div className='sobre-blob sobre-blob-top-right'>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="var(--cor-rosa)" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,79.6,-45.8C87.4,-32.5,90,-16.3,88.5,-0.9C87,14.5,81.3,29,73.1,42.1C64.9,55.2,54.2,66.9,41,74.7C27.8,82.5,13.9,86.5,-0.9,88.1C-15.7,89.7,-31.5,89,-44.5,82.5C-57.5,76,-67.8,63.8,-75.3,50.1C-82.9,36.4,-87.6,21.2,-88.2,5.9C-88.8,-9.4,-85.2,-24.8,-77.8,-38.3C-70.4,-51.7,-59.2,-63.2,-45.6,-70.7C-32,-78.3,-16,-81.8,-0.1,-81.7C15.8,-81.5,31.6,-77.6,44.7,-76.4Z" transform="translate(100 100)" />
            </svg>
          </div>
          <div className='sobre-blob sobre-blob-bottom-left'>
            <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <path fill="var(--cor-laranja)" d="M39.5,-65.3C52.9,-60.3,67,-53.4,74.6,-42C82.2,-30.6,83.3,-15.3,82.5,-0.5C81.7,14.4,79,28.7,71.8,40.5C64.6,52.3,52.8,61.5,39.8,68.3C26.8,75.1,13.4,79.5,-0.5,80.3C-14.3,81.1,-28.7,78.4,-41.3,71.6C-54,64.8,-65,54,-73.2,41C-81.5,28,-87.1,14,-86.5,0.4C-85.8,-13.3,-79,-26.5,-70.6,-38.3C-62.2,-50,-52.2,-60.2,-40.1,-66C-28,-71.7,-14,-73,0,-73C14,-73,28,-70.3,39.5,-65.3Z" transform="translate(100 100)" />
            </svg>
          </div>

          {/* Left: Photo */}
          <div className='sobre-foto-container'>
            <div className='sobre-foto-frame'>
              <img src={SobreFoto} alt="Danadinhos - Nosso espaço de festas" className='sobre-foto' />
              {/* <div className='sobre-foto foto-placeholder'>Foto do Buffet</div> */}
            </div>
          </div>

          {/* Center: Text */}
          <div className='sobre-texto'>
            <h2 className='sobre-saudacao'>CONHEÇA O</h2>
            <h3 className='sobre-titulo'>DANADINHOS —<br />A VIDA É UMA FESTA!</h3>
            <p className='sobre-descricao'>
              O <strong>Dana Dinho’s</strong> é o primeiro e mais tradicional buffet infantil de Monte Alto e região.
              <strong> Estamos há mais de 20 anos no mercado de festas infantis. <br />
              </strong> Realizamos também <strong>festas adultas, casamentos, debutantes, festas escolares e eventos corporativos.</strong>
              <br />Nossos brinquedos são seguros, modernos e para <br /> operá-los temos uma equipe gentil, educada e apaixonada por comemorações.
            </p>
            <div className='sobre-assinatura'>
              <span className='sobre-assinatura-texto'>Danadinhos</span>
              <span className='sobre-assinatura-coracao'>♥</span>
            </div>
          </div>

          {/* Right: Services */}
          <div className='sobre-servicos'>
            <div className='sobre-servico-item'>
              <div className='sobre-servico-icone'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <span className='sobre-servico-nome'>Buffet Completo</span>
            </div>
            <div className='sobre-servico-item'>
              <div className='sobre-servico-icone'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className='sobre-servico-nome'>Decoração Temática</span>
            </div>
            <div className='sobre-servico-item'>
              <div className='sobre-servico-icone'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <span className='sobre-servico-nome'>Animação Infantil</span>
            </div>
            <div className='sobre-servico-item'>
              <div className='sobre-servico-icone'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
              <span className='sobre-servico-nome'>Brinquedos</span>
            </div>
            <div className='sobre-servico-item'>
              <div className='sobre-servico-icone'>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </div>
              <span className='sobre-servico-nome'>Fotografia</span>
            </div>
          </div>
        </section>

        <section id='local' className='imagens-local' aria-labelledby='local-titulo'>
          <div
            className='local-carousel-container'
            onMouseEnter={() => setLocalCarouselPaused(true)}
            onMouseLeave={() => setLocalCarouselPaused(false)}
            onFocus={() => setLocalCarouselPaused(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setLocalCarouselPaused(false);
              }
            }}
          >
            <div className='local-intro'>
              <span className='local-intro-eyebrow'>UM ESPAÇO FEITO PARA SORRIR</span>
              <h2 id='local-titulo'>Conheça nosso espaço</h2>
              <p>Cada cantinho do Danadinhos foi pensado para acolher, brincar e criar memórias que ficam para sempre.</p>
            </div>
            <div className='local-carousel-track'>
              {localImages.map((img, index) => {
                let position = 'hidden';
                if (index === activeLocalIndex) {
                  position = 'active';
                } else if (index === (activeLocalIndex - 1 + localImages.length) % localImages.length) {
                  position = 'prev';
                } else if (index === (activeLocalIndex + 1) % localImages.length) {
                  position = 'next';
                }

                return (
                  <button
                    type='button'
                    key={index}
                    className={`local-carousel-slide ${position}`}
                    onClick={() => setActiveLocalIndex(index)}
                    aria-label={`Ver foto: ${img.alt}`}
                    aria-pressed={index === activeLocalIndex}
                    tabIndex={position === 'hidden' ? -1 : 0}
                    aria-hidden={position === 'hidden' ? true : undefined}
                  >
                    <img src={img.src} alt={img.alt} loading='lazy' decoding='async' />
                  </button>
                );
              })}
            </div>

            <div className='local-carousel-dots' aria-label='Selecionar grupo de fotos'>
              {[0, 1, 2].map((dotIndex) => (
                <button
                  type='button'
                  key={dotIndex}
                  className={`local-dot ${Math.floor(activeLocalIndex / 2) === dotIndex ? 'active' : ''}`}
                  onClick={() => setActiveLocalIndex(dotIndex * 2)}
                  aria-label={`Mostrar grupo de fotos ${dotIndex + 1}`}
                  aria-pressed={Math.floor(activeLocalIndex / 2) === dotIndex}
                />
              ))}
            </div>

            <div className='local-caption' aria-live='polite' aria-atomic='true'>
              <h3>{localImages[activeLocalIndex].title}</h3>
              <p>{localImages[activeLocalIndex].description}</p>
            </div>
          </div>
        </section>

        <section
          className="endereco-section"
          id="endereco"
          aria-label="Nossa localização"
        >
          <div className="endereco-container">
            <div className="endereco-texto">
              <span className="endereco-subtitulo">VENHA NOS CONHECER</span>

              <h2>
                <span>A diversão</span>
                <br />
                <strong>tem endereço!</strong>
              </h2>

              <p>
                Venha conhecer nosso espaço e imaginar sua próxima festa com a gente.
              </p>

              <address>
                <span className="endereco-localizacao-icone" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                </span>
                <strong>Danadinhos</strong>
                <span>Rua Ananias de Carvalho, 558</span>
                <span>Monte Alto – SP</span>
              </address>
            </div>
            <div className="endereco-composicao">
              <span
                className="endereco-forma endereco-forma-azul"
                aria-hidden="true"
              />
              <span
                className="endereco-forma endereco-forma-amarela"
                aria-hidden="true"
              />
              <span
                className="endereco-forma endereco-forma-verde"
                aria-hidden="true"
              />

              <div className="endereco-mapa">
                <iframe
                  title="Localização do Danadinhos"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3718.310733455704!2d-48.492041589060214!3d-21.25916418036693!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94b945b64d27652d%3A0x252034ef9d54a9af!2sDana%20dinhos!5e0!3m2!1spt-BR!2sbr!4v1790944753579!5m2!1spt-BR!2sbr"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className='footer-page'>
        <div className='footer-conteudo'>
          <div className='footer-marca'>
            <img src={LogoPrincipal} alt='Danadinhos' />
            <p>A vida é uma festa!</p>
          </div>
          <div className='footer-coluna'>
            <h2>Explore</h2>
            <a href='#conheca'>Conheça o Danadinhos</a>
            <a href='#local'>Nosso espaço</a>
            <a href='#endereco'>Como chegar</a>
          </div>
          <div className='footer-coluna'>
            <h2>Fale com a gente</h2>
            <span>Rua Ananias de Carvalho, 558</span>
            <span>Monte Alto – SP</span>
            <a href={whatsappUrl} target='_blank' rel='noreferrer'>WhatsApp do buffet</a>
          </div>
        </div>
        <div className='footer-base'>
          <span>Danadinhos Buffet Infantil</span>
          <span>Feito para celebrar momentos felizes.</span>
        </div>
      </footer>
      <a
        className='whatsapp-flutuante'
        href={whatsappUrl}
        target='_blank'
        rel='noreferrer'
        aria-label='Enviar orçamento pelo WhatsApp'
        data-wa-tooltip='Confirme seu orçamento'
        onClick={(event) => {
          event.preventDefault()
          window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
        }}
      >
        <svg viewBox='0 0 24 24' aria-hidden='true'>
          <path d='M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z' />
        </svg>
      </a>
    </div>
  )
}

export default App
