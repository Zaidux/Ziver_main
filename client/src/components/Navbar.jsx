import React from 'react';
import { NavLink } from 'react-router-dom';
import { Pickaxe, ClipboardList, Users, Briefcase, Wallet, User } from 'lucide-react';
import './Navbar.css';

const Navbar = () => {
  const navItems = [
    {
      href: "/",
      icon: Pickaxe,
      label: "Mining",
    },
    {
      href: "/tasks",
      icon: ClipboardList,
      label: "Tasks",
    },
    {
      href: "/referrals",
      icon: Users,
      label: "Referrals",
    },
    {
      href: "/job-marketplace",
      icon: Briefcase,
      label: "Jobs",
    },
    {
      href: "/wallet",
      icon: Wallet,
      label: "Wallet",
    },
    {
      href: "/profile",
      icon: User,
      label: "Profile",
    },
  ];

  return (
    <nav className="bottom-navbar">
      {navItems.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink 
            key={item.href}
            to={item.href}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon className="nav-icon" strokeWidth={2.5} />
            <span className="nav-label">{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default Navbar;