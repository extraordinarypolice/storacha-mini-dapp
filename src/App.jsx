import React, { useEffect, useState } from "react";
import * as Client from "@storacha/client";
import * as Delegation from "@storacha/client/delegation";

export default function App() {
  const [client, setClient] = useState(null);
  const [did, setDid] = useState("");
  const [spaceName, setSpaceName] = useState("");
  const [file, setFile] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Initialize Storacha client and delegation
  useEffect(() => {
    const init = async () => {
      try {
        const c = await Client.create();
        setDid(c.agent.did());

        // Fetch the delegation from backend
        const apiUrl = `http://localhost:3000/api/delegation/${c.agent.did()}`;
        const res = await fetch(apiUrl);
        const buf = new Uint8Array(await res.arrayBuffer());
        const delegation = await Delegation.extract(buf);

        if (!delegation.ok) throw new Error("Failed to extract delegation");

        const space = await c.addSpace(delegation.ok);
        await c.setCurrentSpace(space.did());

        setClient(c);
        setMessage("✅ Connected to Storacha successfully!");
      } catch (err) {
        console.error(err);
        setError("❌ Failed to initialize Storacha client");
      }
    };

    init();
  }, []);

  // Handle file upload
  const handleUpload = async () => {
    if (!client) {
      setError("Client not ready yet!");
      return;
    }
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    setError("");
    setMessage("⏳ Uploading...");

    try {
      const res = await client.uploadFile(file);
      if (!res.ok) throw new Error("Upload failed");

      setUploads((prev) => [...prev, { name: file.name, cid: res.ok.root }]);
      setMessage("✅ File uploaded successfully!");
    } catch (err) {
      console.error(err);
      setError("❌ Upload failed: " + err.message);
    }
  };

  return (
    <div className="flex h-screen bg-storachaWhite text-gray-800">
      {/* Sidebar */}
      <div className="w-64 bg-storachaRed text-white p-6 flex flex-col">
        <h1 className="text-2xl font-bold mb-6">Storacha</h1>
        <div className="space-y-4 flex-1">
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-storachaRed px-3 py-2 rounded-lg font-semibold w-full"
          >
            Refresh
          </button>
        </div>
        <button className="mt-auto bg-gray-100 text-storachaRed px-3 py-2 rounded-lg font-semibold">
          Logout
        </button>
      </div>

      {/* Main Area */}
      <div className="flex-1 p-10 overflow-y-auto">
        <h2 className="text-3xl font-bold mb-2 text-storachaRed">
          Storacha Mini App
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Your DID:
          <span className="block break-all font-mono text-gray-800 mt-1">
            {did || "Loading..."}
          </span>
        </p>

        {/* Upload Section */}
        <div className="border p-6 rounded-xl shadow-md mb-6">
          <h3 className="text-xl font-semibold mb-4 text-storachaRed">
            Upload to Storacha
          </h3>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="block mb-4"
          />
          <button
            onClick={handleUpload}
            className="bg-storachaRed text-white px-4 py-2 rounded-lg"
          >
            Upload
          </button>

          {message && <p className="mt-4 text-green-600">{message}</p>}
          {error && <p className="mt-4 text-red-600">{error}</p>}
        </div>

        {/* Uploads List */}
        <div>
          <h3 className="text-xl font-semibold mb-3 text-storachaRed">
            Uploaded Files
          </h3>
          {uploads.length === 0 ? (
            <p className="text-gray-500">No uploads yet.</p>
          ) : (
            <ul className="space-y-2">
              {uploads.map((u, i) => (
                <li key={i} className="border p-3 rounded-md bg-gray-50">
                  <span className="font-semibold">{u.name}</span>
                  <br />
                  <a
                    href={`https://${u.cid["/"]}.ipfs.storacha.link`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 text-sm break-all"
                  >
                    {u.cid["/"]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
