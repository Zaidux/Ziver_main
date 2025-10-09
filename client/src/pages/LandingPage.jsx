"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import "./LandingPage.css"

const LandingPage = () => {
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqs = [
    {
      question: "What blockchain does Ziver use?",
      answer:
        "Ziver operates on the TON (The Open Network) blockchain, providing fast, secure, and scalable transactions with minimal fees.",
    },
    {
      question: "Do I need to invest money to earn rewards?",
      answer:
        "No! Ziver's unique Social-to-Earn model allows you to earn ZP tokens through engagement, completing tasks, and contributing to the community without any upfront investment.",
    },
    {
      question: "Is it Sharia-compliant?",
      answer:
        "Yes, Ziver is designed to be fully Sharia-compliant, offering halal earning opportunities and adhering to Islamic finance principles.",
    },
    {
      question: "Is Ziver beginner-friendly?",
      answer:
        "Ziver is built for everyone. No technical knowledge required - just sign up with your email or social account and start earning.",
    },
  ]

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="hero-section">
        <nav className="landing-nav">
          <div className="nav-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ZIVER</span>
          </div>
          <div className="nav-badge">Decentralized</div>
        </nav>

        <div className="hero-content">
          <h1 className="hero-title">
            Welcome to <span className="gradient-text">Ziver</span>
          </h1>
          <h2 className="hero-subtitle">MoneValues</h2>
          <p className="hero-description">
            A Sharia-compliant Web3 social platform where you earn, connect, and engage. Join the future of social media
            with creator monetization, crowdfunding, and zero technical barriers.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="cta-button primary">
              Get Early Access
            </Link>
            <Link to="/login" className="cta-button secondary">
              Sign In
            </Link>
          </div>

          <p className="hero-note">Be among the first to test features and shape the future of Web3 social media</p>
        </div>

        <div className="scroll-indicator">
          <div className="scroll-icon">↓</div>
          <span>Learn More</span>
        </div>
      </div>

      {/* What is Ziver Section */}
      <section className="content-section">
        <div className="section-icon">🔍</div>
        <h2 className="section-title">What is Ziver?</h2>
        <p className="section-description">
          Ziver is a Sharia-compliant Web3 social-fi platform that brings together social media, content creation,
          crowdfunding, and freelancing. Everyone can monetize their content and engagement while growing the next
          generation of Web3 adopters.
        </p>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>For Web3 Enthusiasts</h3>
            <p>Liberal Muslims tired of established Web2 platforms seeking Sharia-compliant alternatives</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎨</div>
            <h3>For Creators</h3>
            <p>Content creators, freelancers, and investors looking to crowdfund Sharia-compliant projects</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>For Everyone</h3>
            <p>Muslim users seeking halal crypto opportunities with zero technical knowledge required</p>
          </div>
        </div>
      </section>

      {/* Problems Solved Section */}
      <section className="content-section dark">
        <h2 className="section-title">Problems We Solve</h2>

        <div className="problems-grid">
          <div className="problem-card">
            <div className="problem-number">01</div>
            <h3>Unrewarding Social Media</h3>
            <p>
              Most platforms monetize users without rewarding them. Ziver offers multiple revenue streams for both
              creators and users.
            </p>
          </div>
          <div className="problem-card">
            <div className="problem-number">02</div>
            <h3>Lack of Engagement Incentives</h3>
            <p>Our Social-to-Earn model rewards active participation, discussions, and community contributions.</p>
          </div>
          <div className="problem-card">
            <div className="problem-number">03</div>
            <h3>High Entry Barriers</h3>
            <p>Sign up with email or social accounts. No wallet setup required. Zero gas fees for interactions.</p>
          </div>
          <div className="problem-card">
            <div className="problem-number">04</div>
            <h3>Disconnected Communities</h3>
            <p>One platform to discover projects, find communities, and access opportunities with community voting.</p>
          </div>
          <div className="problem-card">
            <div className="problem-number">05</div>
            <h3>No Sharia-Compliant DeFi</h3>
            <p>
              Millions of Muslims excluded from DeFi. Ziver provides halal alternatives adhering to Islamic finance.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="content-section">
        <h2 className="section-title">What You Can Do on Ziver</h2>

        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">💰</div>
            <p>Earn crypto through social engagement and valuable contributions</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">📈</div>
            <p>Stake earnings to grow them with zero technical knowledge</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🌐</div>
            <p>Access DeFi powered by engagement, not capital</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">🤝</div>
            <p>Create or join Sharia-compliant campaigns and crowdfunds</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">✅</div>
            <p>Stay compliant and profitable with halal opportunities</p>
          </div>
          <div className="benefit-item">
            <div className="benefit-icon">💳</div>
            <p>Multi-chain wallet with zero gas fees on Ziver blockchain</p>
          </div>
        </div>
      </section>

      {/* Special Features */}
      <section className="content-section highlight">
        <h2 className="section-title">What Makes Ziver Special?</h2>
        <div className="special-content">
          <div className="special-icon">🏦</div>
          <h3>Ziver is Your Mobile Bank That Pays You</h3>
          <p>
            Introducing Ziv-para-DeFi: Invest without holding ZIV coins. Stake your time and earn by contributing to the
            platform. Every action has value, and you get rewarded.
          </p>
          <div className="special-features">
            <div className="special-feature">
              <span className="check-icon">✓</span>
              <span>No wallet setup required</span>
            </div>
            <div className="special-feature">
              <span className="check-icon">✓</span>
              <span>Earn through engagement</span>
            </div>
            <div className="special-feature">
              <span className="check-icon">✓</span>
              <span>100% Sharia-compliant</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="content-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-container">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`faq-item ${expandedFaq === index ? "expanded" : ""}`}
              onClick={() => toggleFaq(index)}
            >
              <div className="faq-question">
                <span>{faq.question}</span>
                <span className="faq-icon">{expandedFaq === index ? "−" : "+"}</span>
              </div>
              {expandedFaq === index && <div className="faq-answer">{faq.answer}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <span className="logo-icon">⚡</span>
            <span className="logo-text">ZIVER</span>
          </div>

          <div className="footer-social">
            <a href="#" className="social-link" aria-label="Twitter">
              𝕏
            </a>
            <a href="#" className="social-link" aria-label="Telegram">
              T
            </a>
            <a href="#" className="social-link" aria-label="Medium">
              M
            </a>
          </div>

          <div className="footer-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Disclaimer</a>
          </div>

          <p className="footer-powered">Powred by the Ziver-Chain</p>
          <p className="footer-support">Support: ziverofficial567@gmail.com</p>
          <p className="footer-copyright">© 2025 Ziver. All rights reserved.</p>
        </div>

        <div className="footer-disclaimer">
          <p>
            <strong>Disclaimer:</strong> The information provided on Ziver does not constitute investment, financial, or
            trading advice. Ziver does not recommend buying, selling, or holding any cryptocurrency. Do your own
            research before making any investment decisions.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
