import { Link } from 'react-router-dom'
import { useEffect, useRef, useState, useCallback } from 'react'

// Counter animation hook
function useCounterAnimation(endValue: string, duration: number = 2000) {
    const [displayValue, setDisplayValue] = useState('0')
    const [hasAnimated, setHasAnimated] = useState(false)

    const animate = useCallback(() => {
        if (hasAnimated) return
        setHasAnimated(true)

        // Parse the end value (handles formats like "10.000+", "98%", "100+")
        const numericPart = endValue.replace(/[^0-9]/g, '')
        const suffix = endValue.replace(/[0-9.]/g, '')
        const targetNum = parseInt(numericPart, 10)

        const startTime = performance.now()

        const updateCounter = (currentTime: number) => {
            const elapsed = currentTime - startTime
            const progress = Math.min(elapsed / duration, 1)

            // Ease-out cubic
            const easeOut = 1 - Math.pow(1 - progress, 3)
            const currentValue = Math.floor(targetNum * easeOut)

            // Format with dots for thousands (Brazilian format)
            const formatted = currentValue.toLocaleString('pt-BR')
            setDisplayValue(formatted + suffix)

            if (progress < 1) {
                requestAnimationFrame(updateCounter)
            }
        }

        requestAnimationFrame(updateCounter)
    }, [endValue, duration, hasAnimated])

    return { displayValue, animate, hasAnimated }
}

export function LandingPage() {
    const observerRef = useRef<IntersectionObserver | null>(null)
    const statsRef = useRef<HTMLDivElement | null>(null)

    // Counter animations for stats
    const counter1 = useCounterAnimation('10.000+')
    const counter2 = useCounterAnimation('100+')
    const counter3 = useCounterAnimation('98%')
    const counter4 = useCounterAnimation('15+')
    const counters = [counter1, counter2, counter3, counter4]

    useEffect(() => {
        // Scroll animation observer for general elements
        observerRef.current = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )

        const elements = document.querySelectorAll('.animate-on-scroll')
        elements.forEach((el) => observerRef.current?.observe(el))

        // Stats counter observer
        const statsObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        counters.forEach(c => c.animate())
                    }
                })
            },
            { threshold: 0.3 }
        )

        if (statsRef.current) {
            statsObserver.observe(statsRef.current)
        }

        // Navbar scroll effect
        const handleScroll = () => {
            const navbar = document.querySelector('.landing-navbar')
            if (window.scrollY > 50) {
                navbar?.classList.add('scrolled')
            } else {
                navbar?.classList.remove('scrolled')
            }
        }
        window.addEventListener('scroll', handleScroll)

        return () => {
            observerRef.current?.disconnect()
            statsObserver.disconnect()
            window.removeEventListener('scroll', handleScroll)
        }
    }, [])

    const stats = [
        { value: '10.000+', label: 'Alunos Impactados', icon: 'bi-people-fill' },
        { value: '100+', label: 'Escolas Parceiras', icon: 'bi-building' },
        { value: '98%', label: 'Taxa de Satisfação', icon: 'bi-star-fill' },
        { value: '15+', label: 'Municípios Atendidos', icon: 'bi-geo-alt-fill' },
    ]

    const features = [
        { icon: 'bi-shield-check', title: 'Segurança de Dados', description: 'Proteção LGPD completa para dados educacionais' },
        { icon: 'bi-cloud-arrow-up', title: 'Acesso na Nuvem', description: 'Disponível 24/7 de qualquer dispositivo' },
        { icon: 'bi-phone', title: 'Responsivo', description: 'Funciona em computadores, tablets e smartphones' },
        { icon: 'bi-headset', title: 'Suporte Dedicado', description: 'Atendimento especializado para gestores' },
        { icon: 'bi-lightning-charge', title: 'Alta Performance', description: 'Sistema rápido e estável para grandes volumes' },
        { icon: 'bi-translate', title: 'Acessibilidade', description: 'Interface inclusiva para todos os usuários' },
    ]

    const howItWorks = [
        { step: '01', title: 'Diagnóstico', description: 'Analisamos as necessidades do seu município', icon: 'bi-search' },
        { step: '02', title: 'Implantação', description: 'Configuramos e personalizamos a plataforma', icon: 'bi-gear' },
        { step: '03', title: 'Capacitação', description: 'Treinamos gestores e professores', icon: 'bi-mortarboard' },
        { step: '04', title: 'Monitoramento', description: 'Acompanhamos resultados continuamente', icon: 'bi-graph-up-arrow' },
    ]

    const solutions = [
        {
            title: 'SALF',
            subtitle: 'Sistema de Avaliação e Learning Formativo',
            description: 'Avaliações diagnósticas e formativas alinhadas à BNCC e SAEB para acompanhar o desenvolvimento dos alunos em tempo real.',
            features: [
                'Avaliação por níveis de proficiência',
                'Relatórios alinhados ao SAEB',
                'Banco de atividades BNCC',
                'Acompanhamento em tempo real',
            ],
            icon: 'bi-clipboard-data',
            color: '#1e3a5f',
            image: '/solution-assessment.png',
        },
        {
            title: 'SAG',
            subtitle: 'Sistema de Apoio à Gestão',
            description: 'Dashboard analítico completo para gestores municipais tomarem decisões baseadas em dados educacionais.',
            features: [
                'Avaliações diagnósticas',
                'Dashboard analítico completo',
                'Simulados preparatórios',
                'Indicadores de desempenho',
            ],
            icon: 'bi-graph-up-arrow',
            color: '#00a8e8',
            image: '/about-educators.png',
        },
        {
            title: 'Pensamento Computacional',
            subtitle: 'Educação Digital para o Futuro',
            description: 'Material didático completo do infantil ao 9º ano, 100% alinhado à BNCC com formação continuada de professores.',
            features: [
                '100% alinhado à BNCC',
                'Material didático completo',
                'Formação de professores',
                'Atividades práticas',
            ],
            icon: 'bi-cpu',
            color: '#1e3a5f',
            image: '/solution-computational.png',
        },
    ]

    const differentials = {
        bncc: [
            'Conteúdos 100% alinhados às competências da Base Nacional Comum Curricular',
            'Material didático organizado por campos de experiência e habilidades',
            'Avaliações que acompanham o desenvolvimento integral do estudante',
            'Formação continuada para professores sobre a BNCC',
        ],
        saeb: [
            'Questões elaboradas seguindo as matrizes de referência do SAEB',
            'Simulados preparatórios para as avaliações externas',
            'Relatórios de desempenho por descritor e habilidade',
            'Acompanhamento do IDEB municipal em tempo real',
        ],
    }

    const testimonials = [
        {
            quote: 'A MAXIMIZA transformou a gestão educacional do nosso município. Conseguimos identificar as dificuldades dos alunos e agir de forma precisa.',
            author: 'Maria Silva',
            role: 'Secretária de Educação',
            city: 'São Luís - MA',
            rating: 5,
        },
        {
            quote: 'Com o sistema de avaliações, nossos índices no IDEB melhoraram significativamente. Uma ferramenta essencial para qualquer gestor.',
            author: 'João Santos',
            role: 'Diretor de Escola',
            city: 'Imperatriz - MA',
            rating: 5,
        },
        {
            quote: 'A formação em pensamento computacional preparou nossos professores para o futuro da educação. Resultados incríveis!',
            author: 'Ana Costa',
            role: 'Coordenadora Pedagógica',
            city: 'Caxias - MA',
            rating: 5,
        },
    ]



    return (
        <div className="landing-page">
            {/* Navbar */}
            <nav className="navbar navbar-expand-lg fixed-top landing-navbar">
                <div className="container">
                    <a href="#" className="navbar-brand">
                        <img
                            src="/logo-maximiza.png"
                            alt="MAXIMIZA"
                            height="40"
                        />
                    </a>
                    <button
                        className="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#navbarNav"
                    >
                        <span className="navbar-toggler-icon"></span>
                    </button>
                    <div className="collapse navbar-collapse" id="navbarNav">
                        <ul className="navbar-nav mx-auto">
                            <li className="nav-item">
                                <a className="nav-link" href="#sobre">Sobre</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#solucoes">Soluções</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#diferenciais">Diferenciais</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#parceiros">Parceiros</a>
                            </li>
                            <li className="nav-item">
                                <a className="nav-link" href="#depoimentos">Depoimentos</a>
                            </li>
                        </ul>
                        <Link to="/login" className="btn btn-primary-gradient">
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Acessar Plataforma
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section - Enhanced with Real Image */}
            <section className="hero-section hero-section-enhanced">
                {/* Floating Shapes Background */}
                <div className="floating-shapes">
                    <div className="floating-shape shape-1"></div>
                    <div className="floating-shape shape-2"></div>
                    <div className="floating-shape shape-3"></div>
                </div>
                <div className="container position-relative" style={{ zIndex: 1 }}>
                    <div className="row align-items-center min-vh-100">
                        <div className="col-lg-6">
                            <div className="hero-badge-animated mb-3">
                                <i className="bi bi-stars me-2"></i>
                                +98% de satisfação dos gestores
                            </div>
                            <h1 className="hero-title">
                                Transforme a <br />
                                <span className="text-gradient-shimmer">Educação</span> com <br />
                                Tecnologia e <br />
                                <span className="text-gradient-shimmer">Inovação</span>
                            </h1>
                            <p className="hero-subtitle">
                                Soluções educacionais completas, alinhadas à BNCC e SAEB,
                                para elevar a qualidade do ensino e potencializar o
                                aprendizado dos seus alunos.
                            </p>
                            <div className="hero-buttons">
                                <a href="#solucoes" className="btn btn-primary-gradient btn-lg me-3">
                                    <i className="bi bi-rocket-takeoff me-2"></i>
                                    Conhecer Soluções
                                </a>
                                <a href="#contato" className="btn btn-outline-primary btn-lg">
                                    <i className="bi bi-telephone me-2"></i>
                                    Fale Conosco
                                </a>
                            </div>
                            <div className="hero-trust-badges mt-4">
                                <div className="trust-item">
                                    <i className="bi bi-patch-check-fill text-success"></i>
                                    <span>Dados Protegidos</span>
                                </div>
                                <div className="trust-item">
                                    <i className="bi bi-award-fill text-warning"></i>
                                    <span>SAEB Certificado</span>
                                </div>
                                <div className="trust-item">
                                    <i className="bi bi-shield-fill-check text-info"></i>
                                    <span>LGPD Compliant</span>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 d-none d-lg-block">
                            <div className="hero-image-container">
                                <img
                                    src="/hero-students.png"
                                    alt="Estudantes usando tecnologia educacional MAXIMIZA"
                                    loading="eager"
                                />
                                <div className="hero-image-overlay"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="hero-wave">
                    <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,69.3C960,85,1056,107,1152,101.3C1248,96,1344,64,1392,48L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z" fill="white" />
                    </svg>
                </div>
            </section>

            {/* Stats Section */}
            <section className="stats-section py-5" ref={statsRef}>
                <div className="container">
                    <div className="row g-4">
                        {stats.map((stat, index) => (
                            <div key={index} className="col-6 col-md-3">
                                <div className={`stat-card text-center animate-on-scroll fade-up delay-${(index + 1) * 100} hover-glow`}>
                                    <div className="stat-icon">
                                        <i className={`bi ${stat.icon}`}></i>
                                    </div>
                                    <h3 className="stat-value counter-animate">
                                        {counters[index].displayValue}
                                    </h3>
                                    <p className="stat-label">{stat.label}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Grid Section */}
            <section className="features-section py-5">
                <div className="container">
                    <div className="text-center mb-5 animate-on-scroll fade-up">
                        <span className="section-badge">Por que escolher a MAXIMIZA?</span>
                        <h2 className="section-title">
                            Recursos que fazem a <span className="text-gradient">Diferença</span>
                        </h2>
                    </div>
                    <div className="row g-4">
                        {features.map((feature, index) => (
                            <div key={index} className="col-md-6 col-lg-4">
                                <div className={`feature-card animate-on-scroll fade-up delay-${((index % 3) + 1) * 100}`}>
                                    <div className="feature-icon">
                                        <i className={`bi ${feature.icon}`}></i>
                                    </div>
                                    <h4>{feature.title}</h4>
                                    <p>{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section - Enhanced with Real Image */}
            <section id="sobre" className="about-section py-5">
                <div className="container">
                    <div className="row align-items-center">
                        <div className="col-lg-6 mb-4 mb-lg-0">
                            <div className="about-image-wrapper animate-on-scroll fade-left">
                                <img
                                    src="/about-educators.png"
                                    alt="Gestores educacionais analisando dados MAXIMIZA"
                                    loading="lazy"
                                />
                                <div className="about-floating-stats">
                                    <div className="floating-stat">
                                        <span className="value">+15%</span>
                                        <span className="label">IDEB</span>
                                    </div>
                                    <div className="floating-stat">
                                        <span className="value">+20%</span>
                                        <span className="label">Proficiência</span>
                                    </div>
                                    <div className="floating-stat">
                                        <span className="value">98%</span>
                                        <span className="label">Satisfação</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6 animate-on-scroll fade-right">
                            <span className="section-badge">Sobre a MAXIMIZA</span>
                            <h2 className="section-title">
                                Democratizando a <span className="text-gradient">Educação de Qualidade</span>
                            </h2>
                            <p className="section-description">
                                A MAXIMIZA é uma EdTech brasileira focada em transformar a educação pública
                                através de soluções tecnológicas inovadoras. Trabalhamos lado a lado com
                                secretarias municipais de educação para garantir que cada aluno tenha
                                acesso a um ensino de excelência.
                            </p>
                            <div className="about-features">
                                <div className="about-feature">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span>Resultados comprovados em avaliações SAEB</span>
                                </div>
                                <div className="about-feature">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span>Equipe pedagógica especializada</span>
                                </div>
                                <div className="about-feature">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span>Suporte técnico dedicado</span>
                                </div>
                                <div className="about-feature">
                                    <i className="bi bi-check-circle-fill text-success"></i>
                                    <span>Formação continuada para professores</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section className="how-it-works-section py-5">
                <div className="container">
                    <div className="text-center mb-5 animate-on-scroll fade-up">
                        <span className="section-badge">Como Funciona</span>
                        <h2 className="section-title">
                            Implementação <span className="text-gradient">Simplificada</span>
                        </h2>
                    </div>
                    <div className="row g-4">
                        {howItWorks.map((item, index) => (
                            <div key={index} className="col-md-6 col-lg-3">
                                <div className={`how-card animate-on-scroll scale-in delay-${(index + 1) * 100}`}>
                                    <div className="step-number">{item.step}</div>
                                    <div className="how-icon">
                                        <i className={`bi ${item.icon}`}></i>
                                    </div>
                                    <h4>{item.title}</h4>
                                    <p>{item.description}</p>
                                    {index < howItWorks.length - 1 && (
                                        <div className="step-connector d-none d-lg-block">
                                            <i className="bi bi-arrow-right"></i>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Solutions Section - Enhanced with Images */}
            <section id="solucoes" className="solutions-section py-5">
                <div className="container">
                    <div className="text-center mb-5 animate-on-scroll fade-up">
                        <span className="section-badge">Nossas Soluções</span>
                        <h2 className="section-title">
                            Soluções <span className="text-gradient">Educacionais Completas</span>
                        </h2>
                        <p className="section-subtitle">
                            Ferramentas integradas para gestão educacional, avaliação e formação
                        </p>
                    </div>
                    <div className="row g-4">
                        {solutions.map((solution, index) => (
                            <div key={index} className="col-lg-4">
                                <div className={`solution-card-enhanced animate-on-scroll fade-up delay-${(index + 1) * 100}`}>
                                    <div className="solution-image-wrapper">
                                        <img
                                            src={solution.image}
                                            alt={`${solution.title} - ${solution.subtitle}`}
                                            loading="lazy"
                                        />
                                        <div className="solution-image-overlay"></div>
                                    </div>
                                    <div className="solution-content">
                                        <div className="solution-icon" style={{ background: solution.color }}>
                                            <i className={`bi ${solution.icon}`}></i>
                                        </div>
                                        <h3 className="solution-title">{solution.title}</h3>
                                        <p className="solution-subtitle">{solution.subtitle}</p>
                                        <p className="solution-description">{solution.description}</p>
                                        <ul className="solution-features">
                                            {solution.features.map((feature, fIndex) => (
                                                <li key={fIndex}>
                                                    <i className="bi bi-check2-circle text-primary"></i>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                        <button className="btn btn-outline-primary w-100">
                                            Saiba Mais
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Differentials Section */}
            <section id="diferenciais" className="differentials-section py-5">
                <div className="container">
                    <div className="text-center mb-5 animate-on-scroll fade-up">
                        <span className="section-badge">Diferenciais Pedagógicos</span>
                        <h2 className="section-title">
                            Alinhamento <span className="text-gradient">BNCC e SAEB</span>
                        </h2>
                    </div>
                    <div className="row g-4">
                        <div className="col-lg-6">
                            <div className="differential-card animate-on-scroll fade-left">
                                <div className="differential-header">
                                    <div className="differential-icon bncc">
                                        <i className="bi bi-book-half"></i>
                                    </div>
                                    <h3>BNCC</h3>
                                </div>
                                <p className="differential-subtitle">Base Nacional Comum Curricular</p>
                                <ul className="differential-list">
                                    {differentials.bncc.map((item, index) => (
                                        <li key={index}>
                                            <i className="bi bi-check-circle-fill text-success"></i>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="differential-card animate-on-scroll fade-right">
                                <div className="differential-header">
                                    <div className="differential-icon saeb">
                                        <i className="bi bi-bar-chart-fill"></i>
                                    </div>
                                    <h3>SAEB</h3>
                                </div>
                                <p className="differential-subtitle">Sistema de Avaliação da Educação Básica</p>
                                <ul className="differential-list">
                                    {differentials.saeb.map((item, index) => (
                                        <li key={index}>
                                            <i className="bi bi-check-circle-fill text-success"></i>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEW: Success Cases / Partners Section */}
            <section id="parceiros" className="success-cases-section py-5">
                <div className="container position-relative">
                    <div className="text-center mb-5 animate-on-scroll fade-up">
                        <span className="section-badge">Parceiros de Sucesso</span>
                        <h2 className="section-title">
                            Transformando a Educação em <span className="text-gradient">Todo o Brasil</span>
                        </h2>
                    </div>
                    <div className="row g-4 mb-4">
                        <div className="col-6 col-md-4">
                            <div className="success-stat-card animate-on-scroll scale-in delay-200">
                                <div className="stat-value">100+</div>
                                <div className="stat-label">Escolas Atendidas</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-4">
                            <div className="success-stat-card animate-on-scroll scale-in delay-200">
                                <div className="stat-value">10K+</div>
                                <div className="stat-label">Alunos Beneficiados</div>
                            </div>
                        </div>
                        <div className="col-6 col-md-4">
                            <div className="success-stat-card animate-on-scroll scale-in delay-300">
                                <div className="stat-value">500+</div>
                                <div className="stat-label">Professores Capacitados</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials Section */}
            <section id="depoimentos" className="testimonials-section py-5">
                <div className="container">
                    <div className="text-center mb-5 animate-on-scroll fade-up">
                        <span className="section-badge">Depoimentos</span>
                        <h2 className="section-title">
                            O que dizem nossos <span className="text-gradient">Parceiros</span>
                        </h2>
                    </div>
                    <div className="row g-4">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="col-lg-4">
                                <div className={`testimonial-card-enhanced animate-on-scroll fade-up delay-${(index + 1) * 100}`}>
                                    <div className="testimonial-avatar-large">
                                        {testimonial.author.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="testimonial-rating">
                                        {[...Array(testimonial.rating)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill text-warning"></i>
                                        ))}
                                    </div>
                                    <div className="testimonial-quote">
                                        <i className="bi bi-quote"></i>
                                    </div>
                                    <p className="testimonial-text">{testimonial.quote}</p>
                                    <div className="testimonial-author">
                                        <div className="author-info">
                                            <h5>{testimonial.author}</h5>
                                            <p>{testimonial.role}</p>
                                            <small>{testimonial.city}</small>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section id="contato" className="cta-section py-5">
                <div className="container">
                    <div className="cta-card animate-on-scroll scale-in">
                        <div className="cta-decoration">
                            <div className="deco-circle deco-1"></div>
                            <div className="deco-circle deco-2"></div>
                        </div>
                        <div className="row align-items-center position-relative">
                            <div className="col-lg-8">
                                <h2>Pronto para transformar a educação do seu município?</h2>
                                <p>Entre em contato e solicite uma demonstração gratuita das nossas soluções.</p>
                                <div className="cta-features">
                                    <span><i className="bi bi-check2"></i> Sem compromisso</span>
                                    <span><i className="bi bi-check2"></i> Demonstração personalizada</span>
                                    <span><i className="bi bi-check2"></i> Suporte especializado</span>
                                </div>
                            </div>
                            <div className="col-lg-4 text-lg-end mt-4 mt-lg-0">
                                <a href="mailto:centralderelacionamento@maximizasoluc.com" className="btn btn-light btn-lg me-2 mb-2">
                                    <i className="bi bi-envelope me-2"></i>
                                    Enviar E-mail
                                </a>
                                <a href="https://wa.me/5598989292525" className="btn btn-success btn-lg mb-2">
                                    <i className="bi bi-whatsapp me-2"></i>
                                    WhatsApp
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="row g-4">
                        <div className="col-lg-4">
                            <img src="/logo-maximiza.png" alt="MAXIMIZA" height="40" className="mb-3" />
                            <p className="footer-description">
                                Transformando a educação pública brasileira através de
                                tecnologia e inovação pedagógica.
                            </p>
                            <div className="social-links">
                                <a href="#" className="social-link"><i className="bi bi-facebook"></i></a>
                                <a href="#" className="social-link"><i className="bi bi-instagram"></i></a>
                                <a href="#" className="social-link"><i className="bi bi-linkedin"></i></a>
                                <a href="#" className="social-link"><i className="bi bi-youtube"></i></a>
                            </div>
                        </div>
                        <div className="col-lg-2">
                            <h5>Soluções</h5>
                            <ul className="footer-links">
                                <li><a href="#solucoes">SALF</a></li>
                                <li><a href="#solucoes">SAG</a></li>
                                <li><a href="#solucoes">Pensamento Computacional</a></li>
                            </ul>
                        </div>
                        <div className="col-lg-2">
                            <h5>Institucional</h5>
                            <ul className="footer-links">
                                <li><a href="#sobre">Sobre Nós</a></li>
                                <li><a href="#diferenciais">Diferenciais</a></li>
                                <li><a href="#depoimentos">Depoimentos</a></li>
                                <li><a href="#parceiros">Parceiros</a></li>
                            </ul>
                        </div>
                        <div className="col-lg-4">
                            <h5>Contato</h5>
                            <ul className="footer-contact">
                                <li>
                                    <i className="bi bi-geo-alt"></i>
                                    São Luís - MA, Brasil
                                </li>
                                <li>
                                    <i className="bi bi-envelope"></i>
                                    centralderelacionamento@maximizasoluc.com
                                </li>
                                <li>
                                    <i className="bi bi-telephone"></i>
                                    (98) 98929-2525
                                </li>
                                <li>
                                    <i className="bi bi-whatsapp"></i>
                                    (98) 98929-2525
                                </li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="row align-items-center">
                            <div className="col-md-6">
                                <p>&copy; 2024 MAXIMIZA Soluções Educacionais. Todos os direitos reservados.</p>
                            </div>
                            <div className="col-md-6 text-md-end">
                                <a href="#" className="footer-link me-3">Política de Privacidade</a>
                                <a href="#" className="footer-link">Termos de Uso</a>
                            </div>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
