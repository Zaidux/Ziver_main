import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page dark">
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDJJuEv7rEIr2KBec8CeLSHZ17qDKq3jaRqGhxdv1Vw7SZoc7Oo3OI6IUl4_6xmxZJy6v_EGxUxtKMWwl6ToWxtuyZ2BJsrbEvPmulB4SsDxXPbnvzC9dKYr-MPY_bG3KUtjM9T7PuTvCq43HdzG5wYtXS7Yxv7KIfWu8-atFoX3OMH2BPS5PhkFAbB3sf1Fyam2lnRzYCgZzyG09T2WSBqjTjFfEW45vmAl8i0b2YbJF7-Ylt2BKfgvf4q5s_QXlIgum54lrP0Cc8')"}}>
        <div className="bg-black bg-opacity-70 min-h-screen">
          {/* Header */}
          <header className="py-4 px-6 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="material-symbols-outlined text-primary text-3xl">public</span>
              <h1 className="text-2xl font-bold">ZIVER</h1>
            </div>
            <button className="border border-primary text-primary px-3 py-1 rounded-full text-sm">Decentralised</button>
          </header>

          {/* Hero Section */}
          <main className="px-6 py-16 text-center">
            <h2 className="text-4xl font-bold leading-tight">Welcome to Ziver</h2>
            <h3 className="text-4xl font-bold text-primary leading-tight">MoneValues</h3>
            <p className="mt-4 text-gray-300 max-w-lg mx-auto">
              We're building a sharia-compliant social media platform for web3 enthusiasts that includes a social engagement model with creator & user monetisation features, crowdfunding, and more token uses with zero technical know-how.
            </p>
            <Link to="/register" className="mt-8 bg-primary text-black font-bold py-3 px-8 rounded-full inline-block">
              Early Access
            </Link>
            <p className="mt-4 text-sm text-gray-400">
              Be the first to get early access, test features, and help us grow.
            </p>
            <p className="mt-2 text-sm text-gray-400">
              Already have an account? <Link to="/login" className="text-primary underline">Login</Link>
            </p>
            <div className="mt-12 flex justify-center">
              <div className="border-2 border-primary rounded-full p-2 glowing-border">
                <span className="material-symbols-outlined text-primary text-4xl">keyboard_arrow_down</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-primary">About</p>
          </main>

          {/* What is Ziver Section */}
          <section className="px-6 py-12">
            <div className="text-center mb-8">
              <span className="material-symbols-outlined text-primary text-5xl">person_search</span>
              <h2 className="text-3xl font-bold mt-2">What is ziver?</h2>
            </div>
            <p className="text-center text-gray-300 max-w-2xl mx-auto">
              Ziver is a sharia-compliant Web3 social-fi that brings social media, content creation, crowdfunding, and a freelance presence where everyone can monetise their content and engagement. We aim to grow the next-gen of web3 adopters. You earn, connect, and engage, directly from your smartphone.
            </p>
            <div className="mt-8">
              <h3 className="text-2xl font-bold text-center">Who is ziver for?</h3>
              <ul className="mt-4 space-y-3 max-w-md mx-auto">
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">check_circle</span>
                  <span>Web3 & liberal muslim enthusiasts tied of established web2 platforms.</span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">check_circle</span>
                  <span>Content creators, creatives, freelancers, and investors who want to crowdfund sharia-compliant ideas or projects.</span>
                </li>
                <li className="flex items-start">
                  <span className="material-symbols-outlined text-primary mr-3 mt-1">check_circle</span>
                  <span>Muslim users seeking sharia-compliant crypto opportunities.</span>
                </li>
              </ul>
            </div>
            <div className="mt-12 flex justify-center">
              <div className="border-2 border-primary rounded-full p-2 glowing-border">
                <span className="material-symbols-outlined text-primary text-4xl">keyboard_arrow_down</span>
              </div>
            </div>
            <p className="mt-2 text-sm text-primary text-center">Our solutions</p>
          </section>

          {/* Problems Solved Section */}
          <section className="px-6 py-12">
            <h2 className="text-3xl font-bold text-center mb-8">What problem does ziver solve?</h2>
            <div className="space-y-4">
              <div className="border border-primary p-4 rounded-lg glowing-border bg-card-dark bg-opacity-50">
                <h3 className="font-bold text-primary">Unrewarding Social Media Landscape for Web3:</h3>
                <p className="text-sm text-gray-300 mt-2">While most crypto platforms monetise individuals are limited to their platform. Ziver offers new revenue-generating avenues for creators and users that: rewards both contributors and referrers. Lack of technical know-how to access earning using ZIV coin.</p>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border bg-card-dark bg-opacity-50">
                <h3 className="font-bold text-primary">Lack of Incentive for Active Social Engagement:</h3>
                <p className="text-sm text-gray-300 mt-2">We solve this with a 'Social-to-Earn' model, which enables the community to actively participate in platform growth by interacting, discussing, helping you learn, and share your experiences and earn.</p>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border bg-card-dark bg-opacity-50">
                <h3 className="font-bold text-primary">High Barriers to Entry for New Users:</h3>
                <p className="text-sm text-gray-300 mt-2">Connecting a wallet is still a complicated process by mainstream. We remove this step by letting users to sign up with their socials. Zero cost gas fee for content interaction via Ziver's protocol & engagement model (ziv-para-DeFi).</p>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border bg-card-dark bg-opacity-50">
                <h3 className="font-bold text-primary">Disconnection between Communities, Projects, & Opportunities:</h3>
                <p className="text-sm text-gray-300 mt-2">There's no single platform that connects people to communities, projects, and opportunities. People need a place where they can discover new things, find like-minded people, and get involved. Ziv offers voting possibilities to the community to promote content and other valuable contributions to be featured in ziver platform.</p>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border bg-card-dark bg-opacity-50">
                <h3 className="font-bold text-primary">Lack of Sharia-Compliant DeFi Options:</h3>
                <p className="text-sm text-gray-300 mt-2">Millions of Muslims are deprived of participating in DeFi due to the unavailability of sharia-compliant alternatives. Ziver is here to fill that gap and provide a platform that adheres to the principles of Islamic finance.</p>
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section className="px-6 py-12 text-center">
            <h2 className="text-3xl font-bold mb-8">What you can do on ziver?</h2>
            <div className="space-y-6">
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">savings</span>
                <p className="text-gray-300">Earn crypto through our social to earn module by engaging with the ziver community and contributing value.</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">trending_up</span>
                <p className="text-gray-300">Stake your earnings to grow them with no technical know-how required.</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">explore</span>
                <p className="text-gray-300">Discover a DeFi system, powered by engagement (ziv para DeFi-no capital)</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">groups</span>
                <p className="text-gray-300">Join or create campaigns, crowdfunds, or job listings with sharia-compliant options.</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">verified_user</span>
                <p className="text-gray-300">Stay compliant and profitable with sharia-compliant DeFi opportunities and projects.</p>
              </div>
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">account_balance_wallet</span>
                <p className="text-gray-300">Access a multi-chain wallet with zero gas fee transactions via our ziver blockchain.</p>
              </div>
            </div>
          </section>

          {/* Special Features Section */}
          <section className="px-6 py-12 text-center">
            <h2 className="text-3xl font-bold mb-4">What Makes Ziv Special?</h2>
            <p className="text-gray-300 max-w-xl mx-auto">
              *Ziv is your mobile bank that pays you.
            </p>
            <p className="text-gray-300 max-w-xl mx-auto mt-4">
              It is the system behind where you can invest without holding the Ziv coin. We offer Ziv-para-DeFi where you stake time & earn by contributing to the ziver platform. Our social-fi model is built on the idea that every action has value, and you get rewarded.
            </p>
            <p className="text-gray-300 max-w-xl mx-auto mt-4">
              Ready to earn, explore, and be rewarded for your time?
            </p>
            <div className="mt-8 flex justify-center">
              <div className="flex flex-col items-center">
                <span className="material-symbols-outlined text-primary text-4xl mb-2">phonelink_setup</span>
                <h3 className="text-2xl font-bold">No-Wallet Setup</h3>
                <p className="text-gray-400">No wallet - No problem. All you need is your phone.</p>
              </div>
            </div>
            <p className="mt-8 text-xs text-gray-500 max-w-2xl mx-auto">
              Disclaimer: The information provided on ziver platform does not constitute investment advice, financial advice, trading advice, or any other sort of advice and you should not treat any of the website's content as such. Ziver does not recommend that any cryptocurrency should be bought, sold, or held by you.
            </p>
          </section>

          {/* FAQ Section */}
          <section className="px-6 py-12">
            <h2 className="text-3xl font-bold text-center mb-8">FAQs</h2>
            <div className="space-y-4 max-w-2xl mx-auto">
              <div className="border border-primary p-4 rounded-lg glowing-border flex justify-between items-center bg-card-dark bg-opacity-50">
                <p>Q. What blockchain does ziver use?</p>
                <span className="material-symbols-outlined text-primary">expand_more</span>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border flex justify-between items-center bg-card-dark bg-opacity-50">
                <p>Q. Do I need to invest money to earn rewards?</p>
                <span className="material-symbols-outlined text-primary">expand_more</span>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border flex justify-between items-center bg-card-dark bg-opacity-50">
                <p>Q. Is it sharia-compliant?</p>
                <span className="material-symbols-outlined text-primary">expand_more</span>
              </div>
              <div className="border border-primary p-4 rounded-lg glowing-border flex justify-between items-center bg-card-dark bg-opacity-50">
                <p>Q. Is ziver beginner-friendly?</p>
                <span className="material-symbols-outlined text-primary">expand_more</span>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="px-6 py-8 text-center text-gray-400">
            <div className="flex justify-center space-x-6 mb-6">
              <a href="#"><img alt="Twitter icon" className="h-6 w-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBr7ZKJgaiNyzsgY2Z7m_NEbo6fdblOkVc7zvMEc1AXlVZ8LGXX_ZOgOx87WMcQgAu9pQfzt1W9osMRtDFShpV1cqCirPFaRRUG_vbm95g8zvy1eAJ85lC1HnPoFAEOoIcBNfUQZD06uvuySYUSNYRZtKHnylrwukuT2u2FM66o4UtHare_ZoQsBHcTTD6MMMc5gWCwNnur9c2uDre4kuxFk7xLJdYSrN2dCxsiDPFvBeHQw6or36-mvBRiMuWPXG4SD_yfqM1FB78"/></a>
              <a href="#"><img alt="Telegram icon" className="h-6 w-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDViTBOPba1OLjWYJfmntCenEkZmksaqkYr5YKj8tqF8AWJ82aYW-08JfqJYyGcsf0QG8DnMYDewyUMW5xL_eLaq-z0Eq6rwJmKYKZU0wAQ2b-Z2a1rL8oPhWXPWJfl7Wkibz8uFhAhtrtfnMYiHSUuMpgErk32wOvKRt5df_aUhBpC0bUOAHON43sB_9k3Mht7AsCokFU1ndKkPO4prjefbXYmObLXrXCBLKC5dVVjBnePOKua1wFlBWdRNh3RLViGWlFOm0AJFmY"/></a>
              <a href="#"><img alt="Medium icon" className="h-6 w-6" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAxkRjmJHxt_LGftNq7bwUrokowU8IqSkDefTIW9vF6QCPnRu6_lVJ9NY_s9ncHMV1SfCqTdNnCTqKnOr8iecs4Iaw4JTF9_ehhLg5MFg8P78IidnvD8paUfO8igwnW8wsvv3llyl2gtZ2Wj5_X35XY4BAFWGH05j61sZqzcbGI0PLfbNDj38HGQEXSdwbmJbSDo75HUi_EKs5FpHaZzoHtgZcpzueZCw3DAJZNtX4bYXKDFjpkUOzkfDaySUUTIi_vIvCMeqv3HS4"/></a>
            </div>
            <div className="text-sm">
              <p>Powered by TON <a className="underline" href="#">[Privacy]</a> <a className="underline" href="#">[Disclaimer]</a></p>
              <p>support: support@ziver.app</p>
              <p className="mt-4">© 2023 ziver.</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
