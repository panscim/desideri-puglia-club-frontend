import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Target, Users, Trophy, Calendar } from 'lucide-react'

const AdminNav = () => {
  const location = useLocation()

  const navItems = [
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { path: '/admin/missions', icon: Target, label: 'Missioni' },
    { path: '/admin/users', icon: Users, label: 'Utenti' },
    { path: '/admin/prizes', icon: Trophy, label: 'Premi' },
    { path: '/admin/eventi', icon: Calendar, label: 'Eventi' }
  ]

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }

  return (
    <div className="bg-white border-b border-sand mb-6 -mx-4 px-4 md:-mx-6 md:px-6">
      <div className="flex overflow-x-auto space-x-1 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path, item.exact)

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${active
                  ? 'bg-gold bg-opacity-20 text-gold'
                  : 'text-olive-light hover:bg-sand hover:text-olive-dark'
                }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default AdminNav
