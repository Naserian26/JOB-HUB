import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../utils/socket';
import EmployerLayout from '../components/EmployerLayout';
import SeekerLayout from '../components/SeekerLayout';
import { MessageSquare, Send, Loader2, Search, X } from 'lucide-react';

import { API_URL as API } from '../config';

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

const formatTime = (date) => {
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  return isToday
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

// ─── Empty States ─────────────────────────────────────────────────────────────

const EmptyState = ({ search }) => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
      <MessageSquare className="h-7 w-7 text-orange-500/60" />
    </div>
    <p className="text-sm font-semibold" style={{ color: '#d6d3d1' }}>
      {search ? 'No conversations found' : 'No messages yet'}
    </p>
    <p className="text-xs max-w-xs" style={{ color: '#78716c' }}>
      {search
        ? 'Try a different name or job title'
        : 'Conversations will appear here when employers or applicants message you'}
    </p>
  </div>
);

const NoChatSelected = () => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
    <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center">
      <MessageSquare className="h-7 w-7 text-orange-500/60" />
    </div>
    <p className="text-sm font-semibold" style={{ color: '#d6d3d1' }}>Select a conversation</p>
    <p className="text-xs" style={{ color: '#78716c' }}>Choose a conversation from the left to start chatting</p>
  </div>
);

// ─── Conversation Item ────────────────────────────────────────────────────────

const ConversationItem = ({ conv, isActive, onClick }) => {
  const hasUnread = conv.unreadCount > 0;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition border-b border-dark-border
        ${isActive ? 'bg-orange-500/10' : 'hover:bg-dark-card'}`}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5"
        style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
      >
        {getInitials(conv.otherPersonName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p
            className="text-sm truncate"
            style={{
              fontWeight: hasUnread ? 600 : 500,
              color: hasUnread ? '#fafaf9' : '#d6d3d1',
            }}
          >
            {conv.otherPersonName}
          </p>
          <span className="text-[10px] shrink-0" style={{ color: '#78716c' }}>
            {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
          </span>
        </div>
        <p className="text-xs truncate mt-0.5" style={{ color: '#78716c' }}>{conv.jobTitle}</p>
        {conv.lastMessage && (
          <p
            className="text-xs truncate mt-0.5"
            style={{
              color: hasUnread ? '#d6d3d1' : '#57534e',
              fontWeight: hasUnread ? 500 : 400,
            }}
          >
            {conv.lastMessage.text}
          </p>
        )}
      </div>
      {hasUnread && (
        <span
          className="mt-1 h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0"
          style={{ backgroundColor: '#f97316', color: '#1c1917' }}
        >
          {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
        </span>
      )}
    </button>
  );
};

// ─── Chat Panel ───────────────────────────────────────────────────────────────

const ChatPanel = ({ conv, currentUserId, token, onNewMessage }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const bottomRef               = useRef(null);

  useEffect(() => {
    if (!conv?.conversationId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setMessages([]);
      try {
        const { data } = await axios.get(
          `${API}/messages/${conv.applicationId}/${conv.seekerId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!cancelled) setMessages(data);
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [conv?.conversationId, conv?.applicationId, conv?.seekerId, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket || !conv?.conversationId) return;

    const handleNewMessage = (data) => {
      if (data.conversationId === conv.conversationId) {
        setMessages(prev => [...prev, data.message]);
        onNewMessage(conv.conversationId, data.message);
      }
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [conv?.conversationId, onNewMessage]);

  const handleSend = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      const { data: msg } = await axios.post(
        `${API}/messages/send`,
        {
          applicationId: conv.applicationId,
          receiverId:    conv.otherPersonId,
          seekerId:      conv.seekerId,
          employerId:    conv.employerId,
          text,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(prev => [...prev, msg]);
      onNewMessage(conv.conversationId, msg);
      setText('');
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!conv) return <NoChatSelected />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-border shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
          style={{ backgroundColor: 'rgba(249,115,22,0.15)', color: '#fb923c' }}
        >
          {getInitials(conv.otherPersonName)}
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#fafaf9' }}>{conv.otherPersonName}</p>
          <p className="text-xs" style={{ color: '#78716c' }}>Re: {conv.jobTitle || 'Application'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#78716c' }} />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm" style={{ color: '#78716c' }}>No messages yet — say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId?.toString() === currentUserId?.toString();
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[70%] space-y-1">
                  <div
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                    }`}
                    style={
                      isMe
                        ? { backgroundColor: '#f97316', color: '#1c1917', fontWeight: 500 }
                        : { backgroundColor: '#292524', color: '#e7e5e4', border: '1px solid #44403c' }
                    }
                  >
                    {msg.text}
                  </div>
                  <p
                    className={`text-[10px] ${isMe ? 'text-right' : 'text-left'}`}
                    style={{ color: '#57534e' }}
                  >
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-dark-border flex items-end gap-2 shrink-0">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 resize-none rounded-xl border border-dark-border bg-dark-bg px-4 py-2.5 text-sm outline-none transition max-h-32"
          style={{
            color: '#fafaf9',
            caretColor: '#f97316',
            '--tw-border-opacity': 1,
          }}
          onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
          onBlur={e => e.target.style.borderColor = ''}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#f97316', color: '#1c1917' }}
          onMouseEnter={e => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#ea580c'; }}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = '#f97316'}
        >
          {sending
            ? <Loader2 className="h-4 w-4 animate-spin" />
            : <Send className="h-4 w-4" />
          }
        </button>
      </div>
    </div>
  );
};

// ─── Messages Content ─────────────────────────────────────────────────────────

const MessagesContent = () => {
  const { user }          = useAuth();
  const [searchParams]    = useSearchParams();
  const [conversations,   setConversations]  = useState([]);
  const [activeConv,      setActiveConv]     = useState(null);
  const [loading,         setLoading]        = useState(true);
  const [search,          setSearch]         = useState('');

  useEffect(() => {
    if (!user?.token) return;
    let cancelled = false;

    const load = async () => {
      const appId      = searchParams.get('appId');
      const seekerId   = searchParams.get('seekerId');
      const employerId = searchParams.get('employerId');
      const name       = searchParams.get('name');
      const job        = searchParams.get('job');

      try {
        const { data } = await axios.get(`${API}/messages/conversations`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        if (cancelled) return;

        if (appId && seekerId && employerId) {
          const conversationId = `${employerId}_${seekerId}_${appId}`;
          const exists = data.find(c => c.conversationId === conversationId);
          const targetConv = exists ?? {
            conversationId,
            applicationId:   appId,
            seekerId,
            employerId,
            otherPersonId:   seekerId,
            otherPersonName: decodeURIComponent(name || 'Applicant'),
            jobTitle:        decodeURIComponent(job || ''),
            lastMessage:     null,
            unreadCount:     0,
          };
          setConversations(exists ? data : [targetConv, ...data]);
          setActiveConv(targetConv);
        } else {
          setConversations(data);
          if (data.length > 0) setActiveConv(data[0]);
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.token, searchParams]);

  const handleNewMessage = useCallback((conversationId, message) => {
    setConversations(prev =>
      prev.map(c =>
        c.conversationId === conversationId
          ? { ...c, lastMessage: message, unreadCount: 0 }
          : c
      )
    );
  }, []);

  const handleSelectConv = (conv) => {
    setActiveConv(conv);
    setConversations(prev =>
      prev.map(c =>
        c.conversationId === conv.conversationId ? { ...c, unreadCount: 0 } : c
      )
    );
  };

  const filtered = conversations.filter(c =>
    c.otherPersonName?.toLowerCase().includes(search.toLowerCase()) ||
    c.jobTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      className="flex overflow-hidden rounded-xl border border-dark-border bg-dark-card"
      style={{ height: 'calc(100vh - 7rem)' }}
    >
      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-r border-dark-border">
        <div className="px-4 py-3 border-b border-dark-border">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5"
              style={{ color: '#78716c' }}
            />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-8 pr-8 py-2 text-xs outline-none transition"
              style={{ color: '#fafaf9' }}
              onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
              onBlur={e => e.target.style.borderColor = ''}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: '#78716c' }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#78716c' }} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState search={search} />
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.conversationId}
                conv={conv}
                isActive={activeConv?.conversationId === conv.conversationId}
                onClick={() => handleSelectConv(conv)}
              />
            ))
          )}
        </div>
      </div>

      {/* Chat */}
      <div className="flex-1 min-w-0">
        <ChatPanel
          conv={activeConv}
          currentUserId={user?.id}
          token={user?.token}
          onNewMessage={handleNewMessage}
        />
      </div>
    </div>
  );
};

// ─── Page wrapper ─────────────────────────────────────────────────────────────

const Messages = () => {
  const { user } = useAuth();

  if (user?.role === 'employer') {
    return (
      <EmployerLayout>
        <MessagesContent />
      </EmployerLayout>
    );
  }

  return (
    <SeekerLayout>
      <MessagesContent />
    </SeekerLayout>
  );
};

export default Messages;