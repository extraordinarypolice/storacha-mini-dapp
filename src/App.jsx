import React, { useState, useEffect } from "react";
import { FiMenu, FiUpload, FiLogOut, FiPlus } from "react-icons/fi";
import { StorachaClient } from "@storacha/client";

export default function App() {
  const [client, setClient] = useState(null);
  const [did, setDid] = useState(null);
  const [email, setEmail] = useState("");
  const [spaces, setSpaces] = useState([]);
  const [currentSpace, setCurrentSpace] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [cid, setCid] = useState("");
  const [loading, setLoading] = useState(false);

  // restore saved state
  useEffect(() => {
    const savedDid = localStorage.getItem("did");
    const savedSpaces = JSON.parse(localStorage.getItem("spaces") || "[]");
    const savedEmail = localStorage.getItem("email");
    if (savedDid) setDid(savedDid);
    if (savedSpaces.length) setSpaces(savedSpaces);
    if (savedEmail) setEmail(savedEmail);
  }, []);

  // Initialize Storacha client
  const initClient = async () => {
    const c = new StorachaClient({
      apiUrl: "https://api.storacha.network", // ✅ ensures it connects to remote Storacha
    });
    await c.connect();
    setClient(c);
    return c;
  };

  const handleLogin = async () => {
    if (!email.trim()) return alert("Please enter an email");
    localStorage.setItem("email", email);
    const c = await initClient();
    const d = await c.did.create();
    setDid(d.id);
    localStorage.setItem("did", d.id);
  };

  const handleCreateSpace = async () => {
    if (!client) return alert("Client not ready");
    const name = prompt("Enter your new space name:");
    if (!name) return;
    setLoading(true);
    try {
      const s = await client.space.create({ name });
      const newSpaces = [...spaces, s];
      setSpaces(newSpaces);
      setCurrentSpace(s);
      localStorage.setItem("spaces", JSON.stringify(newSpaces));
      alert(`Space "${name}" created!`);
    } catch (err) {
      alert("Failed to create space: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fixed Upload
  const handleUpload = async () => {
    if (!client || !currentSpace) return alert("Please select a space first");
    if (!file) return alert("No file selected");
    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: file.type });
      const result = await client.space.blob.add(currentSpace.id, blob, {
        filename: file.name,
        publishToFilecoin: true, // optional
      });
      setCid(result.cid);
      alert("✅ File uploaded successfully to Storacha!");
    } catch (err) {
      alert("❌ Upload failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setDid(null);
    setEmail("");
    setSpaces([]);
    setCurrentSpace(null);
  };

  if (!did) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-storachaWhite text-gray-800">
        <h1 className="text-3xl font-bold mb-4">Storacha Mini App</h1>
        <input
          type="email"
          className="border px-3 py-2 rounded mb-3 w-64"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="bg-storachaRed text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Continue
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 text-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-storachaRed text-white w-64 p-4 transform transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-64"
        }`}
      >
        <h2 className="text-2xl font-bold mb-6">My Spaces</h2>
        <button
          onClick={handleCreateSpace}
          className="flex items-center gap-2 bg-white text-storachaRed px-3 py-2 rounded mb-4 w-full"
        >
          <FiPlus /> Create Space
        </button>
        {spaces.length ? (
          spaces.map((s, i) => (
            <div
              key={i}
              onClick={() => setCurrentSpace(s)}
              className={`p-2 rounded cursor-pointer ${
                currentSpace?.id === s.id ? "bg-red-800" : ""
              }`}
            >
              {s.name}
            </div>
          ))
        ) : (
          <p className="text-sm opacity-80">No spaces yet</p>
        )}
        <button
          onClick={handleLogout}
          className="absolute bottom-6 left-4 flex items-center gap-2 text-white"
        >
          <FiLogOut /> Logout
        </button>
      </div>

      {/* Main Dashboard */}
      <div className="flex-1 flex flex-col p-6 ml-0 sm:ml-64">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-2xl mb-4"
        >
          <FiMenu />
        </button>

        <h1 className="text-3xl font-bold mb-4 text-storachaRed">
          Storacha Dashboard
        </h1>

        <p className="mb-2">
          <strong>DID:</strong> {did}
        </p>

        <p className="mb-4">
          <strong>Current Space:</strong>{" "}
          {currentSpace ? currentSpace.name : "None"}
        </p>

        <input
          type="file"
          onChange={(e) => setFile(e.target.files[0])}
          className="mb-3"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className="bg-storachaRed text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>

        {cid && (
          <p className="mt-4">
            ✅ Uploaded CID:{" "}
            <a
              href={`https://${cid}.ipfs.storacha.link`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-storachaRed underline"
            >
              {cid}
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
