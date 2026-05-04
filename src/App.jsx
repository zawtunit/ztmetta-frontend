import { Routes, Route, Link } from "react-router-dom";

function Home() {
  return (
    <div>
      <h1>Welcome to Ztmetta 🚀</h1>
      <p>This is the home page</p>
    </div>
  );
}

function About() {
  return (
    <div>
      <h1>About</h1>
      <p>This project is for astrology calculation.</p>
    </div>
  );
}

function Contact() {
  return (
    <div>
      <h1>Contact</h1>
      <p>Email: zawtunit@gmail.com</p>
    </div>
  );
}

function App() {
  return (
    <div>
      {/* Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <Link to="/">Home</Link> |{" "}
        <Link to="/about">About</Link> |{" "}
        <Link to="/contact">Contact</Link>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </div>
  );
}

export default App;