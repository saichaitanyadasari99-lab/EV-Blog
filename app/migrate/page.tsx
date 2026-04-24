"use client";

import { useEffect, useState } from "react";

export default function MigratePage() {
  const [status, setStatus] = useState("Click to migrate images to UploadThing...");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function runMigration() {
      setLoading(true);
      setStatus("Migrating... (this may take a minute)");
      
      try {
        const res = await fetch("/api/migrate-images", { method: "POST" });
        const data = await res.json();
        
        if (data.success) {
          setStatus(`✅ Success! Migrated ${data.migrated} images. ${data.failed} failed.`);
        } else {
          setStatus(`❌ Error: ${data.error || JSON.stringify(data)}`);
        }
      } catch (err) {
        setStatus(`❌ Error: ${err}`);
      }
      
      setLoading(false);
    }
    
    runMigration();
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "monospace"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ marginBottom: 20 }}>Image Migration</h1>
        <p style={{ opacity: 0.7 }}>{status}</p>
        {loading && (
          <div style={{ marginTop: 20 }}>
            <div style={{ 
              width: 200, 
              height: 4, 
              background: "#333",
              borderRadius: 2,
              overflow: "hidden",
              margin: "0 auto"
            }}>
              <div style={{ 
                width: "50%", 
                height: "100%", 
                background: "#00d8f2",
                animation: "slide 1s infinite"
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}