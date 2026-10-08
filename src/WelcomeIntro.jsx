import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import logo from './assets/danadinhos-logo-transparente.png'
import './WelcomeIntro.css'

const colors = ['#FD7611', '#D40B81', '#b4ecff', '#FFD65A', '#A8CD67']

export default function WelcomeIntro({ targetRef, onComplete, onUnlock }) {
  const rootRef = useRef(null)
  const logoRef = useRef(null)

  useLayoutEffect(() => {
    let disposed = false
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const context = gsap.context(() => {}, rootRef)
    const finish = () => {
      if (!disposed) onComplete(false)
    }
    const onKey = (event) => {
      if (event.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)
    const timeout = window.setTimeout(finish, 9000)

    const start = async () => {
      try {
        // Aguarda a montagem dos elementos irmãos antes de acessar a logo do header.
        await logoRef.current.decode()
        if (disposed) return
        await targetRef.current.decode()
        if (disposed) return
        context.add(() => {
          const origin = logoRef.current.getBoundingClientRect()
          const target = targetRef.current.getBoundingClientRect()
          gsap.set(logoRef.current, {
            left: origin.left, top: origin.top, width: origin.width,
            xPercent: 0, yPercent: 0, transform: 'none',
          })
          const timeline = gsap.timeline({ onComplete: finish })
          timeline.call(() => {
            document.body.style.overflow = previousOverflow
            rootRef.current.classList.add('welcome-released')
            onUnlock(false)
          }, [], 2.35)
          timeline.to('.welcome-balloon', {
            y: () => -(window.innerHeight + 440),
            x: (index) => (index % 2 ? 38 : -38),
            rotation: (index) => (index % 2 ? 12 : -12),
            duration: 3.4, stagger: { each: 0.07, from: 'center' },
            ease: 'power1.inOut',
          }, 2)
          timeline.to('.welcome-backdrop', { opacity: 0, duration: 0.6, ease: 'power2.inOut' }, 2)
          timeline.to('.welcome-skip', { autoAlpha: 0, duration: 0.2 }, 2)
          timeline.to(logoRef.current, {
            left: target.left, top: target.top, width: target.width,
            duration: 1.45, ease: 'power3.inOut',
          }, 2.3)
        })
      } catch {
        finish()
      }
    }
    const restart = () => {
      context.revert()
      start()
    }
    window.addEventListener('resize', restart)
    start()

    return () => {
      disposed = true
      context.revert()
      window.clearTimeout(timeout)
      window.removeEventListener('resize', restart)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [targetRef, onComplete, onUnlock])

  return (
    <div ref={rootRef} className='welcome-intro'>
      <div className='welcome-backdrop' aria-hidden='true' />
      <div className='welcome-balloons' aria-hidden='true'>
        {Array.from({ length: 13 }, (_, index) => (
          <div key={index} className='welcome-balloon' style={{
            '--balloon-color': colors[index % colors.length],
            '--balloon-size': `${76 + (index % 4) * 18}px`,
            left: `${index * 8 - 3}%`,
          }}>
            <span className='welcome-balloon-body' />
            <svg className='welcome-balloon-string' viewBox='0 0 40 150'>
              <path d='M20 0 C-8 35 48 60 20 95 S12 125 20 150' />
            </svg>
          </div>
        ))}
      </div>
      <img ref={logoRef} className='welcome-logo' src={logo} alt='Danadinhos — A vida é uma festa' />
      <button type='button' className='welcome-skip' onClick={() => onComplete(false)}>Pular abertura</button>
    </div>
  )
}
