import { useState } from "react";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div style={{ textAlign: "center", marginTop: "30px" }}>
      
      {/* Navigation */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setPage("home")}>Home</button>{" "}
        <button onClick={() => setPage("about")}>About</button>{" "}
        <button onClick={() => setPage("contact")}>Contact</button>
      </div>

      {/* Pages */}
      {page === "home" && (
        <div>
          <h1>Welcome to Ztmetta 🚀</h1>
          <p>This is the home page</p>
        </div>
      )}

      {page === "about" && (
        <div>
          <h1>About</h1>
          <p>This project is for astrology calculation.</p>
        </div>
      )}

      {page === "contact" && (
        <div>
          <h1>Contact</h1>
          <p>Email: zawtunit@gmail.com</p>
        </div>
      )}
    </div>
  );
}

export default App;