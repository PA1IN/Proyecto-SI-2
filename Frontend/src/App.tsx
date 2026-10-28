import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Productos from './Productos';
import Bodegas from './Bodegas';
import CrearProducto from './CrearProducto';
import IngresoStock from './IngresoStock';
import DetalleProducto from './DetalleProducto';

export default function App() {
  return (
    <BrowserRouter>
      <header className="banner">
        <div className="contenedor-header">
          <h1 className="logo-amarillo">
            LesGo <span className="logo-sub">Inventario</span>
          </h1>
          <nav className="nav-links">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Productos
            </NavLink>
            <NavLink to="/bodegas" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Bodegas
            </NavLink>
          </nav>
          <div className="banner-acciones">
            <NavLink to="/stock/ingreso" className="boton boton--header">
              + Ingreso de Stock
            </NavLink>
          </div>
        </div>
      </header>
      
      <Routes>
        <Route path="/" element={<Productos />} />
        <Route path="/bodegas" element={<Bodegas />} />
        <Route path="/productos/nuevo" element={<CrearProducto />} />
        <Route path="/stock/ingreso" element={<IngresoStock />} />
        <Route path="/productos/:id" element={<DetalleProducto />} />
      </Routes>
    </BrowserRouter>
  );
}
