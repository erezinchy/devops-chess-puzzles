import { Outlet, NavLink } from 'react-router-dom';
import './Layout.css';

function Layout() {
  return (
    <div className="layout">
      <header className="header">
        <NavLink to="/" className="logo">
          ♟ ChessPuzzle
        </NavLink>
      </header>

      <main className="main container">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className="nav-item">
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Home</span>
        </NavLink>
        <NavLink to="/puzzle" className="nav-item">
          <span className="nav-icon">♟</span>
          <span className="nav-label">Puzzle</span>
        </NavLink>
        <NavLink to="/leaderboard" className="nav-item">
          <span className="nav-icon">🏆</span>
          <span className="nav-label">Rank</span>
        </NavLink>
        <NavLink to="/profile" className="nav-item">
          <span className="nav-icon">👤</span>
          <span className="nav-label">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
}

export default Layout;
