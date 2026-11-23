import { BrowserRouter, Routes, Route, NavLink, Link, Navigate } from 'react-router-dom';
import { RolProvider } from './context/RolContext';
import { useRol } from './context/useRol';
import { ToastProvider } from './context/ToastContext';
import Panel from './paginas/Panel';
import Catalogo from './paginas/Catalogo';
import FichaProducto from './paginas/FichaProducto';
import Movimientos from './paginas/Movimientos';
import Bodegas from './paginas/Bodegas';
import type { Rol } from './tipos';

function Cabecera() {
  const { rol, setRol, puedeIngresar } = useRol();

  return (
    <header className="lesgo-header">
      <div className="header-studs" aria-hidden="true" />

      <Link to="/panel" className="lesgo-logo-btn" aria-label="Ir al panel de Inventario">
        <span className="lesgo-logo-text">LesGo</span>
        <span className="lesgo-logo-badge">INVENTARIO</span>
      </Link>

      <nav aria-label="Navegación principal">
        <ul className="lesgo-nav-links">
          <li>
            <NavLink
              to="/panel"
              className={({ isActive }) => (isActive ? 'nav-link-btn active' : 'nav-link-btn')}
            >
              Panel
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/productos"
              className={({ isActive }) => (isActive ? 'nav-link-btn active' : 'nav-link-btn')}
            >
              Catálogo
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/movimientos"
              className={({ isActive }) => (isActive ? 'nav-link-btn active' : 'nav-link-btn')}
            >
              Movimientos
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/bodegas"
              className={({ isActive }) => (isActive ? 'nav-link-btn active' : 'nav-link-btn')}
            >
              Bodegas
            </NavLink>
          </li>
        </ul>
      </nav>

      <div className="lesgo-header-actions">
        <label className="rol-selector">
          <span className="rol-selector-etiqueta">Ver como</span>
          <select
            value={rol}
            onChange={(e) => setRol(e.target.value as Rol)}
            aria-label="Rol de demostración"
          >
            <option value="JEFE_BODEGA">JEFE_BODEGA</option>
            <option value="OPERADOR_BODEGA">OPERADOR_BODEGA</option>
            <option value="CONSULTA">CONSULTA</option>
          </select>
        </label>

        {puedeIngresar && (
          <Link to="/movimientos?accion=ingreso" className="header-action-btn">
            <span aria-hidden="true">+</span>
            Ingreso de stock
          </Link>
        )}
      </div>
    </header>
  );
}

export default function App() {
  return (
    <RolProvider>
      <ToastProvider>
        <BrowserRouter>
          <div className="app-wrapper">
            <Cabecera />
            <div className="main-content">
              <Routes>
                <Route path="/" element={<Navigate to="/panel" replace />} />
                <Route path="/panel" element={<Panel />} />
                <Route path="/productos" element={<Catalogo />} />
                <Route path="/productos/:id" element={<FichaProducto />} />
                <Route path="/movimientos" element={<Movimientos />} />
                <Route path="/bodegas" element={<Bodegas />} />
                <Route path="*" element={<Navigate to="/panel" replace />} />
              </Routes>
            </div>
          </div>
        </BrowserRouter>
      </ToastProvider>
    </RolProvider>
  );
}
