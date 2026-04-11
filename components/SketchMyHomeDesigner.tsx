'use client';

/**
 * components/SketchMyHomeDesigner.tsx
 * High-performance React wrapper for the Sketch My Home 2D Floor Plan Designer.
 */

import React, { useEffect, useRef, useState } from 'react';
import { CanvasEngine } from '@/lib/sketch-my-home/engine';
import { createClient } from '@/utils/supabase/client';
import { Layout, Hammer, Square, Trash2, Undo, Save, User, LogIn } from 'lucide-react';

export default function SketchMyHomeDesigner({ initialUser }: { initialUser: any }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<CanvasEngine | null>(null);
  const [user, setUser] = useState(initialUser);
  const [selectedItems, setSelectedItems] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      const engine = new CanvasEngine(canvasRef.current);
      engine.onSelectionChange = (items) => setSelectedItems([...items]);
      engineRef.current = engine;
      
      const handleResize = () => engine.resize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  const handleLogin = async () => {
    const email = prompt("Email (Supabase Mock):", "user@example.com");
    if (!email) return;
    const { data } = await supabase.auth.signInWithPassword({
        email,
        password: 'password'
    });
    if (data.user) setUser(data.user);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <div className="main-wrapper">
      <div className="win-menu-bar">
        <div className="menu-item">File</div>
        <div className="menu-item">Edit</div>
        <div className="ml-auto flex items-center px-4" style={{ marginLeft: 'auto' }}>
          {user ? (
            <button onClick={handleLogout} className="flex items-center gap-2 text-xs opacity-80 hover:opacity-100">
              <User size={14} /> {user.email}
            </button>
          ) : (
            <button onClick={handleLogin} className="flex items-center gap-2 text-xs opacity-80 hover:opacity-100">
              <LogIn size={14} /> Sign In
            </button>
          )}
        </div>
      </div>

      <div className="app-container">
        <div className="toolbar">
          <div className="brand">
            <h1>sketch my home</h1>
          </div>
          <div className="tools-group">
            <button className="tool-btn active"><Layout size={18} /> <span>Room</span></button>
            <button className="tool-btn"><Hammer size={18} /> <span>Wall</span></button>
            <button className="tool-btn"><Square size={18} /> <span>Object</span></button>
          </div>
          <div className="tools-group bottom" style={{ marginTop: 'auto' }}>
            <button className="action-btn primary"><Save size={18} /> <span>Save</span></button>
          </div>
        </div>
        <div className="canvas-container">
           <canvas ref={canvasRef} />
        </div>
      </div>
    </div>
  );
}
