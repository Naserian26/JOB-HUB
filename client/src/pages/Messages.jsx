import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { getSocket } from '../utils/socket';
import EmployerLayout from '../components/EmployerLayout';
import SeekerLayout from '../components/SeekerLayout';
import { MessageSquare, Send, Loader2, Search, X } from 'lucide-react';

const API = 'http://localhost:5000/api';

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
    <div className="w-14 h-14 rounded-2xl bg-lime-500/10 flex items-center justify-center">
      <MessageSquare className="h-7 w-7 text-lime-500/60" />
    </div>
    <p className="text-sm font-semibold text-slate-300">
      {search ? 'No conversations found' : 'No messages yet'}
    </p>
    <p className="text-xs text-slate-500 max-w-xs">
      {search
        ? 'Try a different name or job title'
        : 'Conversations will appear here when employers or applicants message you'}
    </p>
  </div>
);

const NoChatSelected = () => (
  <div className="flex flex-col items-center justify-center h-full text-center gap-3 px-6">
    <div className="w-14 h-14 rounded-2xl bg-lime-500/10 flex items-center justify-center">
      <MessageSquare className="h-7 w-7 text-lime-500/60" />
    </div>
    <p className="text-sm font-semibold text-slate-300">Select a conversation</p>
    <p className="text-xs text-slate-500">Choose a conversation from the left to start chatting</p>
  </div>
);

// ─── Conversation Item ────────────────────────────────────────────────────────

const ConversationItem = ({ conv, isActive, onClick }) => {
  const hasUnread = conv.unreadCount > 0;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition border-b border-dark-border
        ${isActive ? 'bg-lime-500/10' : 'hover:bg-dark-card'}`}
    >
      <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0 mt-0.5">
        {getInitials(conv.otherPersonName)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-sm truncate ${hasUnread ? 'font-semibold text-slate-100' : 'font-medium text-slate-300'}`}>
            {conv.otherPersonName}
          </p>
          <span className="text-[10px] text-slate-500 shrink-0">
            {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
          </span>
        </div>
        <p className="text-xs text-slate-500 truncate mt-0.5">{conv.jobTitle}</p>
        {conv.lastMessage && (
          <p className={`text-xs truncate mt-0.5 ${hasUnread ? 'text-slate-300 font-medium' : 'text-slate-600'}`}>
            {conv.lastMessage.text}
          </p>
        )}
      </div>
      {hasUnread && (
        <span className="mt-1 h-5 w-5 rounded-full bg-lime-500 flex items-center justify-center text-[9px] font-bold text-dark-bg shrink-0">
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
      <div className="flex items-center gap-3 px-6 py-4 border-b border-dark-border shrink-0">
        <div className="w-9 h-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-semibold text-indigo-300 shrink-0">
          {getInitials(conv.otherPersonName)}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">{conv.otherPersonName}</p>
          <p className="text-xs text-slate-500">Re: {conv.jobTitle || 'Application'}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-slate-500">No messages yet — say hello!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId?.toString() === currentUserId?.toString();
            return (
              <div key={msg._id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[70%] space-y-1">
                  <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-lime-500 text-dark-bg rounded-br-sm font-medium'
                      : 'bg-dark-card text-slate-200 rounded-bl-sm ring-1 ring-dark-border'
                  }`}>
                    {msg.text}
                  </div>
                  <p className={`text-[10px] text-slate-600 ${isMe ? 'text-right' : 'text-left'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-dark-border flex items-end gap-2 shrink-0">
        <textarea
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type a message… (Enter to send)"
          className="flex-1 resize-none rounded-xl border border-dark-border bg-dark-bg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none focus:border-lime-500/40 focus:bg-dark-card transition max-h-32"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending}
          className="h-10 w-10 rounded-xl bg-lime-500 flex items-center justify-center text-dark-bg shrink-0 hover:bg-lime-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
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

  // Load conversations + handle URL params in one effect
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
    <div className="flex overflow-hidden rounded-xl border border-dark-border bg-dark-card" style={{ height: 'calc(100vh - 7rem)' }}>

      {/* Sidebar */}
      <div className="w-80 shrink-0 flex flex-col border-r border-dark-border">
        <div className="px-4 py-3 border-b border-dark-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded-lg pl-8 pr-8 py-2 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-lime-500/40 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
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