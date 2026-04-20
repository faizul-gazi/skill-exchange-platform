import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { layoutContainerClass } from './container.js'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main id="main-content" className="flex flex-1 flex-col">
        <div className={`${layoutContainerClass} flex-1 py-8 sm:py-10 md:py-12 lg:py-14`}>
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  )
}
