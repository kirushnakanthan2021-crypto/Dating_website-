import Link from "next/link";
import Nav from "@/components/Nav";

export default function Home() {
  return <><Nav/><main className="shell">
    <section className="hero"><div>
      <span className="eyebrow">♥ A little more meaningful</span>
      <h1>Meet someone<br/>who feels like <em>home.</em></h1>
      <p>Less endless scrolling. More real conversations. Discover people who share your energy, values and curiosity.</p>
      <div className="hero-actions"><Link className="btn primary" href="/signup">Create your free profile ↗</Link><Link className="btn secondary" href="/discover">Explore people</Link></div>
      <div className="trust"><span>✓ Real connections</span><span>✓ Privacy-first design</span><span>✓ 18+ only</span></div>
    </div><div className="visual">
      <img className="photo-main" src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=85" alt="Illustrative smiling portrait"/>
      <div className="float-card float-one"><div className="avatar-row"><span style={{fontSize:24}}>💗</span><div><strong>Good energy only</strong><div className="small">Meet at your own pace</div></div></div></div>
      <div className="float-card float-two"><div className="avatar-row"><img className="avatar" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80" alt="Illustrative profile"/><div><strong>Alex, 28</strong><div className="small">Curious · Kind · Outdoorsy</div></div><span>✨</span></div></div>
    </div></section>
    <section className="section"><div className="section-head"><h2>Make room for a real connection</h2><p>Tools to help you meet people thoughtfully, keep conversations comfortable and stay in control.</p></div>
      <div className="features"><article className="feature"><div className="feature-icon">💞</div><h3>Meaningful matches</h3><p>Like profiles you connect with. When the interest is mutual, a match opens the door to chat.</p></article>
      <article className="feature"><div className="feature-icon">💬</div><h3>Conversation first</h3><p>Build a connection through private messages before deciding whether to take things further.</p></article>
      <article className="feature"><div className="feature-icon">🛡️</div><h3>Your comfort matters</h3><p>Block and report controls help you manage unwanted contact and flag unsafe behaviour.</p></article></div>
    </section>
    <section className="cta"><div><h2 style={{fontFamily:"Manrope",margin:"0 0 8px"}}>Your next chapter could start here.</h2><p style={{margin:0}}>Create a profile in a few minutes.</p></div><Link className="btn primary" href="/signup">Join Pairly ♥</Link></section>
    <p className="site-warning" style={{marginTop:24}}>Pairly is a project starter. Sample visuals are illustrative, not real members. Only adults aged 18+ may use a dating service. Add identity checks, moderation and privacy safeguards before public launch.</p>
  </main><footer className="shell footer"><span>© {new Date().getFullYear()} Pairly</span><span><Link href="/safety">Safety</Link> · <Link href="/privacy">Privacy</Link> · <Link href="/terms">Terms</Link></span></footer></>;
}
