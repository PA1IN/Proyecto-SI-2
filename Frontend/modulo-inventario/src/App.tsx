import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Productos from './Productos';
import Bodegas from './Bodegas';

export default function App() {
  return (
    <BrowserRouter>
      <header className="banner">
        <div className="contenedor-header">
          <h1 className="logo-amarillo">Inventario LesGo</h1>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Productos
            </NavLink>
            <NavLink to="/bodegas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Bodegas
            </NavLink>
          </nav>
        </div>
      </header>
      
      <Routes>
        <Route path="/" element={<Productos />} />
        <Route path="/bodegas" element={<Bodegas />} />
      </Routes>
    </BrowserRouter>
  );
}