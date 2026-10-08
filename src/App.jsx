import LogoPrincipal from '/src/assets/danadinhos-logo-transparente.png'
import BannerPrincipal from '/src/assets/banner-principal.png'
import SobreFoto from '/src/assets/sec-sobre/DanadinhosFachada.png'
import { useRef, useState } from 'react'
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



function App() {
  const carouselRef = useRef(null)
  const headerLogoRef = useRef(null)
  const [introPlaying, setIntroPlaying] = useState(true)
  const [introBlocking, setIntroBlocking] = useState(true)

  const carouselImages = [
    { src: FestaAlmoco, alt: "Festa Almoço" },
    { src: FestaColegial, alt: "Festa Colegial" },
    { src: FestaCoquetel, alt: "Festa Coquetel" },
    { src: FestaEscolar, alt: "Festa Escolar" },
    { src: FestaMacarrao, alt: "Festa Macarrão" }
  ];

  const localImages = [
    { src: LocalSalao, alt: 'Salão com mesas preparadas e decoração de balões', title: 'Um salão para celebrar', description: 'Mesas preparadas, decoração acolhedora e um ambiente para reunir a família e os amigos.' },
    { src: LocalTrampolim, alt: 'Crianças no espaço de camas elásticas e piscina de espuma', title: 'Trampolim Park', description: 'Camas elásticas e piscina de espuma para a criançada pular e aproveitar a festa.' },
    { src: LocalBaby, alt: 'Área baby com brinquedo de nave, mini cozinha e oficina', title: 'Um mundo para os pequenos', description: 'Mini cozinha, oficina e brinquedos coloridos para soltar a imaginação.' },
    { src: LocalJogos, alt: 'Máquinas de jogos eletrônicos e mesa de air game', title: 'Diversão a cada partida', description: 'Jogos eletrônicos e air game para compartilhar desafios e boas risadas.' },
    { src: LocalQuadra, alt: 'Quadra de futebol cercada por redes, ao lado do escorregador', title: 'Espaço para brincar em equipe', description: 'Uma quadra de futebol para reunir os amigos e entrar na brincadeira.' },
    { src: LocalCriancas, alt: 'Três crianças sentadas em um brinquedo colorido, com adesivos nos rostos', title: 'Momentos que viram memória', description: 'Brincadeiras compartilhadas e muita alegria para fazer parte da história de cada festa.' },
  ];
  const [activeLocalIndex, setActiveLocalIndex] = useState(0);

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

  const handleScrollToContent = (e) => {
    e.preventDefault()
    const element = document.getElementById('conheca')
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
    }
  }

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
            <div className='lista-festas-carroussel' ref={carouselRef} tabIndex={0} role='region' aria-label='Tipos de festas; deslize para ver mais'>
              {carouselImages.map((img, index) => (
                <img key={index} src={img.src} alt={img.alt} />
              ))}
            </div>
            <button className='carousel-btn right-btn' onClick={() => scrollCarousel(1)} aria-label="Próximo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </section>

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
          <div className='local-carousel-container'>
            <div className='local-intro'>
              <h2 id='local-titulo'>Conheça nosso espaço</h2>
              <p>Um passeio pelo salão, pelos brinquedos e pelos momentos de diversão no Danadinhos.</p>
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
                A diversão
                <br />
                tem endereço!
              </h2>

              <p>
                Venha conhecer nosso espaço e imaginar sua próxima festa com a gente.
              </p>

              <address>
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
    </div>
  )
}

export default App
