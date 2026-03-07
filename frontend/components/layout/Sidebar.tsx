'use client';

import { useAuthStore } from '@/stores/authStore';
import { useMusicStore } from '@/stores/musicStore';
import { useRouter, usePathname } from 'next/navigation';
import { useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { Home, Search, Library, Bot, User, Music2 } from 'lucide-react';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { playlists, createPlaylist, updatePlaylistImage } = useMusicStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [editingPlaylist, setEditingPlaylist] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'upload' | 'url'>('url');

  const navItems = [
    { icon: <Home size={20} />, label: 'Trang chủ', path: '/home' },
    { icon: <Search size={20} />, label: 'Tìm kiếm', path: '/search' },
    { icon: <Library size={20} />, label: 'Thư viện', path: '/library' },
    { icon: <Bot size={20} />, label: 'AI Chat', path: '/chat' },
    { icon: <User size={20} />, label: 'Cá nhân', path: '/profile' },
  ];

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    createPlaylist(newPlaylistName.trim());
    setNewPlaylistName('');
    setShowCreateModal(false);
  };

  const handleUpdateImage = (playlistId: string) => {
    if (!imageUrl.trim()) return;
    updatePlaylistImage(playlistId, imageUrl.trim());
    setImageUrl('');
    setEditingPlaylist(null);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <aside className="sidebar">
        {/* Logo */}
        <div className="logo">
          <div className="logo-icon">
            <Music2 size={20} color="white" />
          </div>
          <div>
            <div className="logo-text">MusicAI</div>
            <div className="logo-sub">Your vibe</div>
          </div>
        </div>

        {/* Navigation */}
        {navItems.map((item) => (
          <div
            key={item.path}
            className={`nav-item ${pathname === item.path ? 'active' : ''}`}
            onClick={() => router.push(item.path)}
          >
            {item.icon}
            {item.label}
          </div>
        ))}

        {/* Playlists */}
        <div className="nav-section">
          Playlist
          <button
            className="add-btn"
            onClick={() => setShowCreateModal(true)}
          >
            +
          </button>
        </div>

        {playlists.map((pl) => (
          <div
            key={pl.id}
            className="pl-item"
            onClick={() => router.push(`/library?playlist=${pl.id}`)}
          >
            <div className="pl-thumb">
              {pl.image_url ? (
                <img src={pl.image_url} alt={pl.name} />
              ) : (
                <div className="pl-thumb-default">🎵</div>
              )}
              {/* hover → hiện nút edit */}
              <div
                className="pl-ov"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditingPlaylist(pl.id);
                  setImageUrl(pl.image_url || '');
                }}
              >
                ✏️
              </div>
            </div>
            <div className="pl-info">
              <div className="pl-name">{pl.name}</div>
              <div className="pl-count">
                {pl.song_count || 0} bài
              </div>
            </div>
          </div>
        ))}

        {/* User footer */}
        <div className="sidebar-footer">
          <div className="user-card" onClick={handleLogout}>
            <div className="user-av">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="user-name">{user?.username}</div>
              <div className="user-sub">Đăng xuất</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Modal tạo playlist */}
      {showCreateModal && (
        <div
          className="modal-backdrop show"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Tạo Playlist mới</div>
            <input
              className="modal-input"
              type="text"
              placeholder="Tên playlist..."
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="modal-btns">
              <button
                className="btn btn-ghost"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreatePlaylist}
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal đổi ảnh playlist */}
      {editingPlaylist && (
        <div
          className="modal-backdrop show"
          onClick={() => setEditingPlaylist(null)}
        >
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">Đổi ảnh Playlist</div>

            {/* Preview ảnh */}
            <div className="modal-cover">
              {imageUrl ? (
                <img className="modal-preview-img"
                  src={imageUrl}
                  alt="preview"
                />
              ) : (
                '🎵'
              )}
            </div>

            {/* Tabs */}
            <div className="modal-tabs">
              <button
                className={`tab ${activeTab === 'url' ? 'active' : ''}`}
                onClick={() => setActiveTab('url')}
              >
                🔗 Dán URL
              </button>
              <button
                className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
                onClick={() => setActiveTab('upload')}
              >
                📁 Upload
              </button>
            </div>

            {activeTab === 'url' ? (
              <input
                className="modal-input"
                type="text"
                placeholder="Dán link ảnh vào đây..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            ) : (
              <input
                className="modal-input"
                type="file"
                accept="image/*"
                aria-label="Upload ảnh playlist"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    // chuyển file thành base64 URL để preview
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      setImageUrl(ev.target?.result as string);
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            )}

            <div className="modal-btns">
              <button
                className="btn btn-ghost"
                onClick={() => setEditingPlaylist(null)}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleUpdateImage(editingPlaylist)}
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}