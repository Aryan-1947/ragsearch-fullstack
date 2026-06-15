import { Link, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, FileText, BarChart2, Zap, Sun, Moon, LogOut, Menu, X } from 'lucide-react'
import { useTheme } from '../App'
import { useAuth0 } from '@auth0/auth0-react'
import { useState } from 'react'

const links = [
  { to: '/ask', label: 'Ask', icon: Search },
  { to: '/documents', label: 'Documents', icon: FileText },
  { to: '/evaluation', label: 'Evaluation', icon: BarChart2 },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const theme = useTheme()
  const { isAuthenticated, user, logout } = useAuth0()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      <nav style={{
        background: theme.navBg, borderBottom: `1px solid ${theme.border}`,
        backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50,
        transition: 'all 0.3s',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

            {/* Logo */}
            <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => setMenuOpen(false)}>
              <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: 10, padding: 8, display: 'flex' }}>
                <Zap size={18} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: 18, color: theme.text }}>
                RAG<span style={{ color: '#6366f1' }}>Search</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }} className="desktop-nav">
              {links.map(({ to, label, icon: Icon }) => {
                const active = pathname === to
                return (
                  <Link key={to} to={to} style={{ textDecoration: 'none' }}>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                      border: active ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                      color: active ? '#818cf8' : theme.textSub,
                      fontSize: 14, fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s',
                    }}>
                      <Icon size={15} />{label}
                    </motion.div>
                  </Link>
                )
              })}

              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={theme.toggle} style={{
                  marginLeft: 8, padding: 8, borderRadius: 8,
                  border: `1px solid ${theme.border}`, background: theme.bgCard,
                  cursor: 'pointer', color: theme.textSub, display: 'flex', alignItems: 'center',
                }}>
                {theme.dark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.button>

              {isAuthenticated && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
                  <img src={user.picture} alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #6366f1' }} />
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => logout({ logoutParams: { returnTo: window.location.origin + '/login' } })}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 8,
                      border: `1px solid ${theme.border}`, background: theme.bgCard,
                      color: theme.textMuted, cursor: 'pointer', fontSize: 13,
                    }}>
                    <LogOut size={14} /> Logout
                  </motion.button>
                </div>
              )}
            </div>

            {/* Mobile Right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} className="mobile-nav">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={theme.toggle} style={{
                  padding: 8, borderRadius: 8,
                  border: `1px solid ${theme.border}`, background: theme.bgCard,
                  cursor: 'pointer', color: theme.textSub, display: 'flex', alignItems: 'center',
                }}>
                {theme.dark ? <Sun size={16} /> : <Moon size={16} />}
              </motion.button>

              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => setMenuOpen(!menuOpen)}
                style={{
                  padding: 8, borderRadius: 8,
                  border: `1px solid ${theme.border}`, background: theme.bgCard,
                  cursor: 'pointer', color: theme.textSub, display: 'flex', alignItems: 'center',
                }}>
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </motion.button>
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: 'fixed', top: 64, left: 0, right: 0, zIndex: 49,
              background: theme.navBg, borderBottom: `1px solid ${theme.border}`,
              backdropFilter: 'blur(12px)', padding: '16px 24px',
            }}
          >
            {links.map(({ to, label, icon: Icon }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to} style={{ textDecoration: 'none' }} onClick={() => setMenuOpen(false)}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, marginBottom: 4,
                    background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: active ? '#818cf8' : theme.textSub,
                    fontSize: 15, fontWeight: 500,
                  }}>
                    <Icon size={18} />{label}
                  </div>
                </Link>
              )
            })}

            {isAuthenticated && (
              <div style={{ borderTop: `1px solid ${theme.border}`, marginTop: 8, paddingTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 16px', marginBottom: 8 }}>
                  <img src={user.picture} alt={user.name}
                    style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #6366f1' }} />
                  <span style={{ color: theme.text, fontSize: 14, fontWeight: 500 }}>{user.name}</span>
                </div>
                <button
                  onClick={() => { logout({ logoutParams: { returnTo: window.location.origin + '/login' } }); setMenuOpen(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 16px', borderRadius: 10, width: '100%',
                    border: `1px solid ${theme.border}`, background: theme.bgCard,
                    color: theme.textMuted, cursor: 'pointer', fontSize: 14,
                  }}>
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-nav { display: flex !important; }
        }
        @media (min-width: 769px) {
          .desktop-nav { display: flex !important; }
          .mobile-nav { display: none !important; }
        }
      `}</style>
    </>
  )
}