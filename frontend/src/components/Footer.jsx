import React from 'react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="footer">
      <Link to="/about">About</Link>
      <Link to="/help">Help</Link>
      <Link to="/contact">Contact Us</Link>
    </footer>
  )
}

export default Footer