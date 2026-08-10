import { NavLink } from 'react-router-dom';

export function Navigation() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">▣</span>
        Home
      </NavLink>
      <NavLink to="/plan" className={({ isActive }) => (isActive ? 'active' : '')} end>
        <span className="nav-icon">☰</span>
        Plan
      </NavLink>
      <NavLink to="/progress" className={({ isActive }) => (isActive ? 'active' : '')}>
        <span className="nav-icon">◉</span>
        Progress
      </NavLink>
    </nav>
  );
}
