import { useEffect } from 'react'
import Loader from './components/Loader'
import Background from './components/Background'
import SparkCursor from './components/SparkCursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Stats from './components/Stats'
import Projects from './components/Projects'
import About from './components/About'
import Experience from './components/Experience'
import Services from './components/Services'
import Skills from './components/Skills'
import Tools from './components/Tools'
import Education from './components/Education'
import Contact from './components/Contact'
import Footer from './components/Footer'

export default function App() {
  // Reveal-on-scroll for every [data-reveal] element (hero items are revealed by the intro instead).
  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    )
    document.querySelectorAll('[data-reveal]:not([data-hero])').forEach((el) => io.observe(el))
    // section dividers draw themselves in the first time a section nears the viewport
    const so = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('seen'); so.unobserve(e.target) } }),
      { rootMargin: '0px 0px -20% 0px' },
    )
    document.querySelectorAll('.sec').forEach((el) => so.observe(el))
    return () => { io.disconnect(); so.disconnect() }
  }, [])

  return (
    <>
      <Loader />
      <Background />
      <SparkCursor />
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Experience />
        <Projects />
        <Tools />
        <Services />
        <Education />
        <Stats />
        <Contact />
      </main>
      <Footer />
    </>
  )
}
