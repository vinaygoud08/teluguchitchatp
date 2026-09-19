import React, { useEffect, useState, useRef, memo } from 'react';
import axios from 'axios';
import MessageInput from './MessageInput';
import { useAuth } from '../context/AuthContext';
import { User, UserRound, CircleUser, Phone, Video, Search, MoreVertical, UserPlus, Info, LogOut, X, ChevronUp, ChevronDown, Reply, CornerUpRight, Copy, Pin, PinOff, Trash2, Download, Check, Users, CheckSquare } from 'lucide-react';
import Avatar from './Avatar';
import GroupInfoModal from './GroupInfoModal';
import ImageViewerModal from './ImageViewerModal';
import ProfileViewer from './ProfileViewer';
import { decryptMessage } from '../utils/crypto';

// Inline warning modal
const RestartWarningModal = ({ onConfirm, onCancel }) => (
  <div className="modal-overlay" onClick={onCancel}>
    <div className="modal-content warning-modal" onClick={e => e.stopPropagation()}>
      <div className="warning-icon">⚠️</div>
      <div className="warning-title">Start a New Chat?</div>
      <div className="warning-text">
        This will permanently delete <strong>all messages</strong> in this conversation for <strong>both users</strong>. This cannot be undone.
      </div>
      <div className="warning-actions">
        <button className="btn-cancel" onClick={onCancel}>Cancel</button>
        <button className="btn-danger" onClick={onConfirm}>Yes, Clear Chat</button>
      </div>
    </div>
  </div>
);

const MessageItem = memo(({ 
  msg, 
  isSelf, 
  isSelfChat, 
  senderUser, 
  senderColor, 
  senderIcon, 
  onImageClick, 
  onContextMenu, 
  onProfileClick,
  isSelected,
  isSelectionMode,
  onToggleSelect,
  onCancelSelection,
  onReact,
  currentUserId
}) => {
  const [viewing, setViewing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  
  const msgKey = msg.id || msg.timestamp;
  const [isViewed, setIsViewed] = useState(() => localStorage.getItem(`viewed_${msgKey}`) === 'true');

  const pressTimerRef = useRef(null);
  const touchStartPosRef = useRef({ x: 0, y: 0 });
  const isLongPressRef = useRef(false);

  const handleView = () => {
    if (isViewed || viewing) return;
    setViewing(true);
    
    let timer = 5;
    const interval = setInterval(() => {
      timer -= 1;
      setTimeLeft(timer);
      if (timer <= 0) {
        clearInterval(interval);
        setViewing(false);
        setIsViewed(true);
        localStorage.setItem(`viewed_${msgKey}`, 'true');
      }
    }, 1000);
  };

  const timeStr = msg.timestamp
    ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const isPending = !msg.id || String(msg.id).startsWith('temp_') || msg.status === 'pending';
  const isSeen = Boolean(msg.is_seen || msg.seen || msg.is_read || isSelfChat);
  const isSent = !isPending;

  let dot1Class = 'dot-dim';
  let dot2Class = 'dot-dim';
  let dot3Class = 'dot-dim';
  let statusTooltip = 'Sending...';

  if (isSeen) {
    dot1Class = 'dot-green';
    dot2Class = 'dot-green';
    dot3Class = 'dot-green';
    statusTooltip = 'Seen by recipient';
  } else if (isSent) {
    dot1Class = 'dot-yellow';
    dot2Class = 'dot-yellow';
    dot3Class = 'dot-dim';
    statusTooltip = 'Sent & Delivered (Unseen)';
  } else {
    dot1Class = 'dot-orange';
    dot2Class = 'dot-dim';
    dot3Class = 'dot-dim';
    statusTooltip = 'Sending / Waiting for network';
  }

  // System messages (call history, encrypted notice, group updates)
  const isSystemMsg = msg.text && (
    msg.text.startsWith('📞') || msg.text.startsWith('❌') || msg.text.includes('Voice Call') || msg.text.includes('Video Call') || msg.text.startsWith('📢')
  );

  const handleUserClick = () => {
    if (onProfileClick && !isSelf && !isSystemMsg) {
      onProfileClick(senderUser || { username: msg.sender, id: msg.senderId });
    }
  };

  const openMenu = (e) => {
    if (isSelectionMode) {
      onToggleSelect && onToggleSelect(msg.id || msg.tempId);
      return;
    }
    if (onContextMenu) {
      const clientX = e?.clientX || (e?.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientX : window.innerWidth / 2);
      const clientY = e?.clientY || (e?.changedTouches && e.changedTouches[0] ? e.changedTouches[0].clientY : window.innerHeight / 2);
      onContextMenu({ clientX, clientY }, msg);
    }
  };

  const handleTouchStart = (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      if (window.navigator?.vibrate) {
        try { window.navigator.vibrate(40); } catch(err) {}
      }
      openMenu({ clientX: touch.clientX, clientY: touch.clientY });
    }, 450);
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    }
  };

  const handleTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    isLongPressRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      openMenu({ clientX: e.clientX, clientY: e.clientY });
    }, 450);
  };

  const handleMouseUp = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  if (isSystemMsg) {
    return (
      <div 
        className={`message-row system ${isSelected ? 'selected' : ''}`}
        style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
        onClick={(e) => {
          if (isSelectionMode && e.target === e.currentTarget) {
            onCancelSelection && onCancelSelection();
          }
        }}
      >
        {isSelectionMode && (
          <div 
            className={`selection-checkbox ${isSelected ? 'checked' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect && onToggleSelect(msg.id || msg.tempId);
            }}
          >
            {isSelected && <Check size={12} color="white" />}
          </div>
        )}
        <div 
          className="message system"
          onClick={openMenu}
          onContextMenu={(e) => {
            e.preventDefault();
            openMenu(e);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: 'pointer', userSelect: 'none' }}
          title="Long press or tap for options & reactions"
        >
          <div className="message-content" style={{ cursor: 'pointer' }}>
            {msg.text}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`message-row ${isSelf ? 'self' : 'other'} ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        if (isSelectionMode && e.target === e.currentTarget) {
          onCancelSelection && onCancelSelection();
        }
      }}
    >
      {isSelectionMode && (
        <div 
          className={`selection-checkbox ${isSelected ? 'checked' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect && onToggleSelect(msg.id || msg.tempId);
          }}
        >
          {isSelected && <Check size={12} color="white" />}
        </div>
      )}

      {!isSelf && (
        <div 
          className="message-avatar-btn" 
          onClick={handleUserClick} 
          title={`Click to view ${msg.sender}'s profile`}
          style={{ cursor: 'pointer' }}
        >
          <Avatar userId={senderUser?.id || senderUser?._id || msg.senderId} username={msg.sender} size={32} />
        </div>
      )}

      <div className={`message ${isSelf ? 'self' : 'other'}`}>
        {!isSelf && (
          <div 
            className="message-sender" 
            onClick={handleUserClick}
            style={senderColor ? { color: senderColor, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' } : { display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
            title={`View ${msg.sender}'s profile`}
          >
            {senderIcon === 'male' && <User size={14} color={senderColor} />}
            {senderIcon === 'female' && <UserRound size={14} color={senderColor} />}
            {senderIcon === 'other' && <CircleUser size={14} color={senderColor} />}
            {msg.sender}
          </div>
        )}
        <div 
          className="message-content" 
          onClick={(e) => {
            if (e.target.tagName === 'BUTTON' || e.target.closest('button') || e.target.closest('.viewing-container')) {
              return;
            }
            openMenu(e);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            openMenu(e);
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: 'pointer' }}
          title="Long press or tap for options & reactions"
        >
          {msg.reply_to && (
            <div style={{ background: 'rgba(0,0,0,0.1)', padding: '5px', borderRadius: '5px', marginBottom: '5px', fontSize: '0.85em', borderLeft: '3px solid #2196F3' }}>
              <strong style={{ color: '#2196F3' }}>{msg.reply_to.sender}</strong>
              {msg.reply_to.imageUrl && <div style={{display:'flex', alignItems:'center', gap:'5px'}}><span>📷 Photo</span><img src={msg.reply_to.imageUrl} style={{width:'30px', height:'30px', borderRadius:'4px', objectFit:'cover'}} /></div>}
              {msg.reply_to.text && <div>{msg.reply_to.text.length > 30 ? msg.reply_to.text.substring(0,30)+'...' : msg.reply_to.text}</div>}
            </div>
          )}
          
          <div className="message-body">
            {msg.text && <div className="message-text">{msg.text}</div>}
            
            {msg.imageUrl && !msg.viewOnce && (
              <img 
                src={msg.imageUrl} 
                alt="attached" 
                className="message-img" 
                onClick={() => onImageClick && onImageClick(msg.imageUrl)}
              />
            )}
            
            {msg.imageUrl && msg.viewOnce && !isSelf && (
              <div className="view-once-container">
                {isViewed ? (
                  <div className="viewed-notice" style={{ fontStyle: 'italic', color: '#888', fontSize: '0.85rem' }}>
                    👁️ Photo Opened
                  </div>
                ) : viewing ? (
                  <div className="viewing-container" style={{ position: 'relative' }}>
                    <img src={msg.imageUrl} alt="view once" className="message-img" />
                    <div className="timer-badge" style={{ position: 'absolute', top: 5, right: 5, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem' }}>
                      {timeLeft}s
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={handleView}
                    style={{ background: '#e91e63', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    Tap to View 📸
                  </button>
                )}
              </div>
            )}

            {msg.imageUrl && msg.viewOnce && isSelf && (
              <div className="viewed-notice" style={{ fontStyle: 'italic', color: '#888', fontSize: '0.85rem' }}>
                👁️ View Once Photo Sent
              </div>
            )}

            {msg.gifUrl && <img src={msg.gifUrl} alt="gif" className="message-img" />}
            {msg.stickerUrl && (
              <img src={msg.stickerUrl} alt="sticker" className="message-img"
                style={{ background: 'transparent', maxWidth: '150px' }} />
            )}
          </div>

          {/* Reaction Badges on Message */}
          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
            <div className="message-reactions-tray">
              {Object.entries(msg.reactions).map(([emoji, userIds]) => {
                if (!userIds || userIds.length === 0) return null;
                const hasReacted = userIds.includes(currentUserId);
                return (
                  <span 
                    key={emoji} 
                    className={`reaction-pill ${hasReacted ? 'self-reacted' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact && onReact(msg.id || msg.tempId, emoji);
                    }}
                    title={hasReacted ? `You and ${userIds.length - 1} others reacted ${emoji}` : `${userIds.length} reacted ${emoji}`}
                  >
                    {emoji} {userIds.length > 1 && <span className="reaction-count">{userIds.length}</span>}
                  </span>
                );
              })}
            </div>
          )}

          {!isSystemMsg && timeStr && (
            <div className="message-meta">
              <span className="message-time">{timeStr}</span>
              {isSelf && (
                <div className="message-status-ooo" title={statusTooltip}>
                  <span className={`status-o ${dot1Class}`} />
                  <span className={`status-o ${dot2Class}`} />
                  <span className={`status-o ${dot3Class}`} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const ChatBox = ({
  socket,
  activeChat,
  onInitiateCall,
  onInitiateGroupCall,
  activeGroupCalls = {},
  users = [],
  myGroups = [],
  setMyGroups,
  onlineUsers = new Set(),
  onBackToSidebar,
  strangerUserIds
}) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState({ home: [] }); // room -> messages array
  const [strangerLeft, setStrangerLeft] = useState(false);
  const [showRestartWarning, setShowRestartWarning] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [groupMenuAddMode, setGroupMenuAddMode] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [pendingCall, setPendingCall] = useState(null);
  const [isClearing, setIsClearing] = useState(false);
  const [viewingImage, setViewingImage] = useState(null);
  const [viewingProfile, setViewingProfile] = useState(null);

  // In-Chat Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  
  // Realtime Typing State
  const [typingUsers, setTypingUsers] = useState({}); // userId -> username

  // Context Menu & Replies
  const [contextMenu, setContextMenu] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardMsg, setForwardMsg] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);
  
  // Multi-Selection Mode & Reactions
  const [selectedMessageIds, setSelectedMessageIds] = useState(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const handleToggleSelect = (msgId) => {
    setSelectedMessageIds(prev => {
      const next = new Set(prev);
      if (next.has(msgId)) {
        next.delete(msgId);
        if (next.size === 0) setIsSelectionMode(false);
      } else {
        next.add(msgId);
      }
      return next;
    });
  };

  const handleStartSelection = (msg) => {
    setIsSelectionMode(true);
    setSelectedMessageIds(new Set([msg.id || msg.tempId]));
    setContextMenu(null);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  };

  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const groupMenuRef = useRef(null);
  const isUserNearBottomRef = useRef(true);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);

  const scrollToBottom = (behavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    } else if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  const handleScroll = (e) => {
    const el = e?.currentTarget || messagesContainerRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const isNear = distanceFromBottom < 100;
    isUserNearBottomRef.current = isNear;
    setShowScrollBottomBtn(distanceFromBottom > 160);
  };

  // Close group dropdown menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setShowGroupMenu(false);
      }
    };
    if (showGroupMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [showGroupMenu]);

  // Reset search and selection when chat changes
  useEffect(() => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setCurrentMatchIndex(0);
    setShowGroupMenu(false);
    setIsSelectionMode(false);
    setSelectedMessageIds(new Set());
  }, [activeChat]);

  // Get the other user's info when in private chat
  const isStrangerChat = activeChat ? activeChat.startsWith('stranger_') : false;
  const isSelfChat = user && (activeChat === user.id || activeChat === user._id);
  const activeGroup = (Array.isArray(myGroups) ? myGroups : []).find(g => g.id === activeChat);
  const otherUser = isSelfChat ? user : (Array.isArray(users) ? users : []).find(u => u.id === activeChat);
  
  const checkIsUserOnline = (uId) => {
    if (!uId) return false;
    if (onlineUsers instanceof Set) return onlineUsers.has(uId);
    if (Array.isArray(onlineUsers)) return onlineUsers.includes(uId);
    return false;
  };

  // A chat is considered "online" if it's the home chat, a group chat, or if the individual user is online
  const isOnline = activeChat === 'home' || activeGroup || isSelfChat || (otherUser && checkIsUserOnline(otherUser.id));
  const otherIsOnline = isSelfChat ? true : (otherUser ? checkIsUserOnline(otherUser.id) : false);

  const myDeletedIds = React.useMemo(() => {
    try {
      const uId = user?.id || user?._id || 'guest';
      return new Set(JSON.parse(localStorage.getItem(`deleted_for_me_${uId}`) || '[]'));
    } catch(e) {
      return new Set();
    }
  }, [user, messages]);

  const rawMessages = messages[activeChat] || [];
  const currentMessages = rawMessages.filter(m => !m.id || !myDeletedIds.has(m.id));

  const addOrUpdateMessage = (prevList = [], newMsg) => {
    if (!newMsg) return prevList;
    if (newMsg.id) {
      const existingIndex = prevList.findIndex(m => m.id === newMsg.id || (m.id && String(m.id).startsWith('temp_') && m.text === newMsg.text && m.senderId === newMsg.senderId));
      if (existingIndex !== -1) {
        const updated = [...prevList];
        updated[existingIndex] = { ...updated[existingIndex], ...newMsg };
        return updated;
      }
    }
    if (newMsg.tempId) {
      const existingIndex = prevList.findIndex(m => m.id === newMsg.tempId || m.tempId === newMsg.tempId);
      if (existingIndex !== -1) {
        const updated = [...prevList];
        updated[existingIndex] = { ...updated[existingIndex], ...newMsg };
        return updated;
      }
    }
    const isDuplicate = prevList.some(m => 
      m.senderId === newMsg.senderId && 
      m.text === newMsg.text && 
      Math.abs(new Date(m.timestamp || 0).getTime() - new Date(newMsg.timestamp || 0).getTime()) < 3000
    );
    if (isDuplicate) return prevList;
    return [...prevList, newMsg];
  };

  const handleOptimisticMessage = (msg, chatKey) => {
    isUserNearBottomRef.current = true;
    setMessages(prev => {
      const targetKey = chatKey || 'home';
      const list = prev[targetKey] || [];
      return { ...prev, [targetKey]: addOrUpdateMessage(list, msg) };
    });
    setTimeout(() => {
      scrollToBottom('smooth');
    }, 10);
  };

  const handleBatchCopy = () => {
    const selectedMsgs = currentMessages.filter(m => selectedMessageIds.has(m.id || m.tempId) && m.text);
    const combinedText = selectedMsgs.map(m => `${m.sender ? m.sender + ': ' : ''}${m.text}`).join('\n');
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(combinedText);
    } else {
      const el = document.createElement('textarea');
      el.value = combinedText;
      document.body.appendChild(el);
      el.select();
      try { document.execCommand('copy'); } catch(e) {}
      document.body.removeChild(el);
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
    handleCancelSelection();
  };

  const handleBatchForward = () => {
    const selectedMsgs = currentMessages.filter(m => selectedMessageIds.has(m.id || m.tempId));
    if (selectedMsgs.length === 1) {
      setForwardMsg(selectedMsgs[0]);
    } else if (selectedMsgs.length > 1) {
      setForwardMsg({
        text: selectedMsgs.filter(m => m.text).map(m => m.text).join('\n---\n'),
        isBatch: true,
        messages: selectedMsgs
      });
    }
    handleCancelSelection();
  };

  const handleBatchDelete = (forEveryone = false) => {
    const idsToDelete = Array.from(selectedMessageIds);
    const uId = user?.id || user?._id || 'guest';
    
    if (forEveryone) {
      const roomKey = activeChat === 'home' 
        ? 'home_chat' 
        : (activeGroup ? activeChat : (user ? [user.id, activeChat].sort().join('_') : activeChat));

      idsToDelete.forEach(id => {
        socket.emit('delete_message', { 
          messageId: id, 
          room: roomKey, 
          otherUserId: activeChat !== 'home' ? activeChat : null 
        });
      });
    } else {
      try {
        const stored = JSON.parse(localStorage.getItem(`deleted_for_me_${uId}`) || '[]');
        const updated = Array.from(new Set([...stored, ...idsToDelete]));
        localStorage.setItem(`deleted_for_me_${uId}`, JSON.stringify(updated));
      } catch(e) {}
    }

    setMessages(prev => {
      const curr = prev[activeChat] || [];
      return {
        ...prev,
        [activeChat]: curr.filter(m => !idsToDelete.includes(m.id || m.tempId))
      };
    });

    handleCancelSelection();
  };

  const handleReaction = (msgId, emoji) => {
    const roomKey = activeChat === 'home' 
      ? 'home_chat' 
      : (activeGroup ? activeChat : (user ? [user.id, activeChat].sort().join('_') : activeChat));

    const reactionData = {
      messageId: msgId,
      emoji,
      userId: user?.id || user?._id,
      username: user?.username,
      room: roomKey,
      otherUserId: activeChat !== 'home' ? activeChat : null
    };

    socket.emit('react_message', reactionData);

    setMessages(prev => {
      const list = prev[activeChat] || [];
      return {
        ...prev,
        [activeChat]: list.map(m => {
          if (m.id !== msgId && m.tempId !== msgId) return m;
          const prevReactions = { ...(m.reactions || {}) };
          const userList = prevReactions[emoji] || [];
          const hasReacted = userList.includes(user?.id || user?._id);
          if (hasReacted) {
            prevReactions[emoji] = userList.filter(u => u !== (user?.id || user?._id));
            if (prevReactions[emoji].length === 0) delete prevReactions[emoji];
          } else {
            prevReactions[emoji] = [...userList, user?.id || user?._id];
          }
          return { ...m, reactions: prevReactions };
        })
      };
    });
  };

  useEffect(() => {
    const joinHome = () => {
      socket.emit('join_home');
    };

    if (socket.connected) {
      joinHome();
    }
    socket.on('connect', joinHome);

    const receiveMessageHandler = (data) => {
      setMessages(prev => {
        const homeMsgs = prev['home'] || [];
        return { ...prev, 'home': addOrUpdateMessage(homeMsgs, data) };
      });
    };

    const receivePrivateHandler = async (data) => {
      const otherId = (data.room && data.room.startsWith('stranger_'))
        ? data.room
        : (data.senderId === user?.id ? data.recipientId : data.senderId);
      
      if (otherId) {
        if (data.text && data.text.startsWith('E2EE:') && user) {
          const uId = user.id || user._id;
          const privateKey = localStorage.getItem(`privateKey_${uId}`);
          if (privateKey) {
            try {
              data.text = await decryptMessage(data.text, privateKey);
            } catch (decErr) {
              console.warn("Could not decrypt message with current key:", decErr);
            }
          }
        }
        setMessages(prev => {
          const userMsgs = prev[otherId] || [];
          return { ...prev, [otherId]: addOrUpdateMessage(userMsgs, data) };
        });
      }
    };

    const handleChatCleared = ({ room, chatKey }) => {
      setMessages(prev => ({ ...prev, [chatKey]: [] }));
    };

    const receiveGroupHandler = (data) => {
      setMessages(prev => {
        const groupMsgs = prev[data.room] || [];
        return { ...prev, [data.room]: addOrUpdateMessage(groupMsgs, data) };
      });
    };

    const deleteMessageHandler = ({ messageId }) => {
      setMessages(prev => {
        const newMsgs = { ...prev };
        for (const key in newMsgs) {
          newMsgs[key] = newMsgs[key].filter(m => m.id !== messageId);
        }
        return newMsgs;
      });
    };

    const pinMessageHandler = ({ messageId, isPinned, roomKey }) => {
      setMessages(prev => {
        const newMsgs = { ...prev };
        if (newMsgs[roomKey]) {
          newMsgs[roomKey] = newMsgs[roomKey].map(m => 
            m.id === messageId ? { ...m, is_pinned: isPinned } : m
          );
        }
        return newMsgs;
      });
    };

    const handleReactionEvent = (data) => {
      if (!data || !data.messageId) return;
      setMessages(prev => {
        const newMsgs = { ...prev };
        for (const roomKey in newMsgs) {
          newMsgs[roomKey] = newMsgs[roomKey].map(m => {
            if (m.id === data.messageId || m.tempId === data.messageId) {
              const prevReactions = { ...(m.reactions || {}) };
              const userList = prevReactions[data.emoji] || [];
              const hasReacted = userList.includes(data.userId);
              if (hasReacted) {
                prevReactions[data.emoji] = userList.filter(u => u !== data.userId);
                if (prevReactions[data.emoji].length === 0) delete prevReactions[data.emoji];
              } else {
                prevReactions[data.emoji] = [...userList, data.userId];
              }
              return { ...m, reactions: prevReactions };
            }
            return m;
          });
        }
        return newMsgs;
      });
    };

    const handleTyping = (data) => {
      if (!data || !data.userId || (user && data.userId === (user.id || user._id))) return;
      const currentRoom = isStrangerChat 
        ? activeChat 
        : activeGroup 
        ? activeChat 
        : (user && activeChat ? [user.id || user._id, activeChat].sort().join('_') : null);

      if (data.room === currentRoom || data.recipientId === (user?.id || user?._id) || data.room === activeChat) {
        setTypingUsers(prev => ({ ...prev, [data.userId]: data.username || 'User' }));
      }
    };

    const handleStopTyping = (data) => {
      if (!data || !data.userId) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        delete next[data.userId];
        return next;
      });
    };

    const handleMessageSeen = () => {
      setMessages(prev => {
        const targetKey = activeChat || 'home';
        const list = prev[targetKey] || [];
        const updated = list.map(m => (m.senderId === user?.id || m.senderId === user?._id ? { ...m, is_seen: true, seen: true } : m));
        return { ...prev, [targetKey]: updated };
      });
    };

    socket.on('receive_message', receiveMessageHandler);
    socket.on('receive_private_message', receivePrivateHandler);
    socket.on('receive_group_message', receiveGroupHandler);
    socket.on('chat_cleared', handleChatCleared);
    socket.on('message_deleted', deleteMessageHandler);
    socket.on('message_pinned', pinMessageHandler);
    socket.on('message_reaction', handleReactionEvent);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);
    socket.on('message_seen', handleMessageSeen);

    return () => {
      socket.off('connect', joinHome);
      socket.off('receive_message', receiveMessageHandler);
      socket.off('receive_private_message', receivePrivateHandler);
      socket.off('receive_group_message', receiveGroupHandler);
      socket.off('chat_cleared', handleChatCleared);
      socket.off('message_deleted', deleteMessageHandler);
      socket.off('message_pinned', pinMessageHandler);
      socket.off('message_reaction', handleReactionEvent);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
      socket.off('message_seen', handleMessageSeen);
    };
  }, [socket, user, activeChat, activeGroup, isStrangerChat]);

  useEffect(() => {
    const joinPrivate = () => {
      if (activeChat && activeChat !== 'home' && !activeGroup && user) {
        const isStranger = activeChat.startsWith('stranger_');
        const room = isStranger ? activeChat : [user.id, activeChat].sort().join('_');
        socket.emit('join_private', room);
      } else if (activeGroup) {
        socket.emit('join_group', activeChat);
      }
    };

    if (socket.connected) {
      joinPrivate();
    }
    socket.on('connect', joinPrivate);

    const fetchHistory = async () => {
      if (!token || !activeChat) return;
      if (activeChat === 'home') return;
      if (!user || !token) return;

      try {
        const url = activeGroup ? `/api/groups/${activeChat}/messages` : `/api/messages/${[user.id, activeChat].sort().join('_')}`;
        const res = await axios.get(url, { headers: { 'x-auth-token': token } });
        
        let messagesData = res.data;
        if (!activeGroup && user) {
          const uId = user.id || user._id;
          const privateKey = localStorage.getItem(`privateKey_${uId}`);
          if (privateKey) {
            messagesData = await Promise.all(messagesData.map(async m => {
              if (m.text && m.text.startsWith('E2EE:')) {
                try {
                  return { ...m, text: await decryptMessage(m.text, privateKey) };
                } catch (e) {
                  return m;
                }
              }
              return m;
            }));
          }
        }
        
        setMessages(prev => {
          const oldList = prev[activeChat] || [];
          if (oldList.length === messagesData.length) {
            const isSame = oldList.every((om, i) => {
              const nm = messagesData[i];
              return om && nm && om.id === nm.id && om.text === nm.text && om.is_seen === nm.is_seen && om.is_pinned === nm.is_pinned;
            });
            if (isSame) return prev; // Do not update state if identical to prevent scroll interruptions
          }
          return { ...prev, [activeChat]: messagesData };
        });
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchHistory();
    const pollInterval = setInterval(fetchHistory, 3500);

    return () => {
      socket.off('connect', joinPrivate);
      clearInterval(pollInterval);
    };
  }, [activeChat, user, socket, token, activeGroup]);

  // Instantly scroll down when opening or switching chat
  useEffect(() => {
    isUserNearBottomRef.current = true;
    setShowScrollBottomBtn(false);
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 60);
    return () => clearTimeout(timer);
  }, [activeChat]);

  // Only auto-scroll down if user was already near the bottom
  useEffect(() => {
    if (isUserNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [currentMessages.length]);

  const handleRestartChat = async () => {
    setIsClearing(true);
    try {
      let room = 'home_chat';
      let chatKey = 'home';
      if (activeChat !== 'home' && user) {
        room = [user.id, activeChat].sort().join('_');
        chatKey = activeChat;
      }
      await axios.delete(`/api/messages/${room}`, {
        headers: { 'x-auth-token': token }
      });
      socket.emit('clear_chat', { room, chatKey, otherUserId: activeChat !== 'home' ? activeChat : null });
      setMessages(prev => ({ ...prev, [activeChat]: [] }));
    } catch (err) {
      console.error('Error clearing chat:', err);
      alert('Failed to clear chat. Please try again.');
    } finally {
      setIsClearing(false);
      setShowRestartWarning(false);
    }
  };

  const handleAddStranger = async () => {
    const targetId = strangerUserIds?.[activeChat];
    if (!targetId) return;
    try {
      await axios.post(`/api/users/friend-request/${targetId}`, {}, {
        headers: { 'x-auth-token': token }
      });
      alert('Friend request sent!');
    } catch (err) {
      alert(err.response?.data?.msg || 'Error sending friend request');
    }
  };

  const handleLeaveStranger = () => {
    socket.emit('leave_stranger_room', activeChat);
    setStrangerLeft(true);
    if (onBackToSidebar) onBackToSidebar();
  };

  const renderHeader = () => {
    return (
      <div className="chat-header">
        {onBackToSidebar && (
          <button className="chat-header-btn" onClick={onBackToSidebar} style={{ marginRight: 2 }} aria-label="Back">←</button>
        )}
        
        <div className="chat-header-user">
          {activeChat === 'home' ? (
            <>
              <div className="avatar avatar-public" style={{ width: 40, height: 40, fontSize: '1rem' }}>🌐</div>
              <div className="chat-header-info">
                <h2>Public Chat</h2>
                <span className="status-text online">Public Room</span>
              </div>
            </>
          ) : isStrangerChat ? (
            <>
              <div className="avatar avatar-stranger" style={{ width: 40, height: 40, fontSize: '1rem' }}>🕵️</div>
              <div className="chat-header-info">
                <h2>Stranger</h2>
                <span className={`status-text ${strangerLeft ? 'offline' : 'online'}`}>
                  {strangerLeft ? 'Left the chat' : 'In chat'}
                </span>
              </div>
            </>
          ) : activeGroup ? (
            <>
              <div 
                className="avatar avatar-public" 
                style={{
                  width: 40, height: 40, fontSize: '1.2rem',
                  background: activeGroup.avatar_url ? 'transparent' : 'linear-gradient(135deg, #7c6ff7, #ec4899)',
                  cursor: 'pointer', overflow: 'hidden', padding: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
                onClick={() => setShowGroupInfo(true)}
              >
                {activeGroup.avatar_url ? (
                  <img src={activeGroup.avatar_url} alt="Group" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                ) : (
                  '👥'
                )}
              </div>
              <div 
                className="chat-header-info" 
                style={{ cursor: 'pointer' }} 
                onClick={() => setShowGroupInfo(true)}
              >
                <h2>{activeGroup.name}</h2>
                {Object.keys(typingUsers).length > 0 ? (
                  <span className="status-text online typing-active">
                    <span className="typing-dots-wave">
                      <span className="wave-dot" />
                      <span className="wave-dot" />
                      <span className="wave-dot" />
                    </span>
                    {`${Object.values(typingUsers).join(', ')} typing...`}
                  </span>
                ) : (
                  <span className="status-text online">
                    {activeGroup.myRole === 'admin' ? '🛡️ Group Admin • Tap for info' : 'Group • Tap for info'}
                  </span>
                )}
              </div>
            </>
          ) : isSelfChat ? (
            <>
              <div style={{ position: 'relative', width: 40, height: 40 }}>
                <Avatar userId={user.id || user._id} username={user.username} size={40} />
                <span className="online-dot" style={{ background: '#7c6ff7' }} />
              </div>
              <div className="chat-header-info">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {user.username} <span style={{ fontSize: '0.72rem', background: 'rgba(124, 111, 247, 0.2)', color: '#a594fd', padding: '1px 6px', borderRadius: '6px' }}>You</span>
                </h2>
                <span className="status-text online" style={{ color: '#a594fd' }}>
                  Message yourself • Notes to self
                </span>
              </div>
            </>
          ) : otherUser ? (
            <>
              <div style={{ position: 'relative', width: 40, height: 40, cursor: 'pointer' }} onClick={() => setViewingProfile(otherUser)}>
                <Avatar userId={otherUser.id || otherUser._id} username={otherUser.username} size={40} />
                {otherIsOnline ? <span className="online-dot" /> : <span className="offline-dot" />}
              </div>
              <div className="chat-header-info" style={{ cursor: 'pointer' }} onClick={() => setViewingProfile(otherUser)}>
                <h2>{otherUser.username}</h2>
                {Object.keys(typingUsers).length > 0 ? (
                  <span className="status-text online typing-active">
                    <span className="typing-dots-wave">
                      <span className="wave-dot" />
                      <span className="wave-dot" />
                      <span className="wave-dot" />
                    </span>
                    typing...
                  </span>
                ) : (
                  <span className={`status-text ${otherIsOnline ? 'online' : 'offline'}`}>
                    {otherIsOnline ? 'Online' : 'Offline'}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="chat-header-info">
              <h2>Chat</h2>
            </div>
          )}
        </div>

        <div className="chat-header-actions">
          {/* In-Chat Search Button (Available in all chats) */}
          <button
            className={`chat-header-btn ${isSearchOpen ? 'active' : ''}`}
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            title="Search in conversation"
          >
            <Search size={19} />
          </button>

          {activeChat === 'home' ? (
            <button className="chat-header-btn restart-btn" onClick={() => setMessages(prev => ({ ...prev, home: [] }))}>🔄 Clear</button>
          ) : isStrangerChat ? (
            <>
              <button className="chat-header-btn" onClick={handleAddStranger}>➕ Add Friend</button>
              <button className="chat-header-btn restart-btn" onClick={handleLeaveStranger}>❌ Leave</button>
            </>
          ) : activeGroup ? (
            <>
              {/* Group Voice Call Button */}
              <button
                className="chat-header-btn"
                onClick={() => onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, 'audio')}
                title="Group Voice Call"
              >
                <Phone size={19} />
              </button>

              {/* Group Video Call Button */}
              <button
                className="chat-header-btn"
                onClick={() => onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, 'video')}
                title="Group Video Call"
              >
                <Video size={19} />
              </button>

              {/* Three-Dots Menu Button */}
              <div style={{ position: 'relative' }} ref={groupMenuRef}>
                <button
                  className={`chat-header-btn ${showGroupMenu ? 'active' : ''}`}
                  onClick={() => setShowGroupMenu(!showGroupMenu)}
                  title="Group Settings & Options"
                >
                  <MoreVertical size={20} />
                </button>

                {showGroupMenu && (
                  <div className="group-three-dots-dropdown">
                    <button onClick={() => { setShowGroupInfo(true); setGroupMenuAddMode(false); setShowGroupMenu(false); }}>
                      <Info size={16} />
                      <span>Group Info & Settings</span>
                    </button>
                    <button onClick={() => { setShowGroupInfo(true); setGroupMenuAddMode(true); setShowGroupMenu(false); }}>
                      <UserPlus size={16} />
                      <span>Add Participants</span>
                    </button>
                    <button onClick={() => { setIsSearchOpen(true); setShowGroupMenu(false); }}>
                      <Search size={16} />
                      <span>Search Messages</span>
                    </button>
                    <button onClick={() => { onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, 'audio'); setShowGroupMenu(false); }}>
                      <Phone size={16} />
                      <span>Group Voice Call</span>
                    </button>
                    <button onClick={() => { onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, 'video'); setShowGroupMenu(false); }}>
                      <Video size={16} />
                      <span>Group Video Call</span>
                    </button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-danger" onClick={() => { setShowGroupInfo(true); setShowGroupMenu(false); }}>
                      <LogOut size={16} />
                      <span>Exit / Delete Group</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : isSelfChat ? (
            <button className="chat-header-btn restart-btn" onClick={() => setMessages(prev => ({ ...prev, [activeChat]: [] }))} title="Clear Notes">
              🔄 Clear
            </button>
          ) : (
            <>
              <button className="chat-header-btn" onClick={() => setPendingCall('audio')} title="Voice Call"><Phone size={20} /></button>
              <button className="chat-header-btn" onClick={() => setPendingCall('video')} title="Video Call"><Video size={20} /></button>
            </>
          )}
        </div>
      </div>
    );
  };

  // Find matching message indices for in-chat search
  const matchingMessageIndices = currentMessages
    .map((m, idx) => (m.text && searchQuery.trim() && m.text.toLowerCase().includes(searchQuery.trim().toLowerCase()) ? idx : -1))
    .filter(idx => idx !== -1);

  const pinnedMessage = [...currentMessages].reverse().find(m => m.is_pinned);

  return (
    <div className="chat-container">
      {isSelectionMode ? (
        <div className="chat-selection-bar">
          <div className="selection-count-badge">
            <button className="chat-header-btn" onClick={handleCancelSelection} style={{ color: '#94a3b8' }}>
              <X size={20} />
            </button>
            <span>{selectedMessageIds.size} Selected</span>
          </div>
          <div className="selection-actions">
            {/* Call Buttons in Selection */}
            {activeChat !== 'home' && !isStrangerChat && (
              <>
                <button 
                  className="selection-action-btn call-btn" 
                  onClick={() => {
                    handleCancelSelection();
                    if (activeGroup) onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, 'audio');
                    else setPendingCall('audio');
                  }}
                  title="Voice Call"
                >
                  <Phone size={15} />
                  <span>Call</span>
                </button>
                <button 
                  className="selection-action-btn call-btn" 
                  onClick={() => {
                    handleCancelSelection();
                    if (activeGroup) onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, 'video');
                    else setPendingCall('video');
                  }}
                  title="Video Call"
                >
                  <Video size={15} />
                  <span>Video</span>
                </button>
              </>
            )}

            {/* Copy Selected */}
            <button className="selection-action-btn" onClick={handleBatchCopy} title="Copy selected">
              <Copy size={15} />
              <span>Copy</span>
            </button>

            {/* Forward Selected */}
            <button className="selection-action-btn" onClick={handleBatchForward} title="Forward selected">
              <CornerUpRight size={15} />
              <span>Forward</span>
            </button>

            {/* Delete Selected */}
            <button className="selection-action-btn danger" onClick={() => handleBatchDelete(false)} title="Delete for me">
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>
      ) : (
        renderHeader()
      )}

      {/* Active Group Call Banner */}
      {activeGroup && activeGroupCalls && activeGroupCalls[activeGroup.id] && activeGroupCalls[activeGroup.id].isActive && (
        <div className="active-group-call-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="pulsing-live-dot" />
            <strong style={{ color: '#22c55e' }}>Group {activeGroupCalls[activeGroup.id].callType === 'video' ? 'Video' : 'Voice'} Call In Progress</strong>
            <span style={{ opacity: 0.85, fontSize: '0.82rem' }}>({activeGroupCalls[activeGroup.id].participantsCount} joined)</span>
          </div>
          <button
            className="btn-join-group-call"
            onClick={() => onInitiateGroupCall && onInitiateGroupCall(activeGroup.id, activeGroup.name, activeGroupCalls[activeGroup.id].callType)}
          >
            Join Call 📞
          </button>
        </div>
      )}

      {/* In-Chat Message Search Bar */}
      {isSearchOpen && (
        <div className="in-chat-search-bar">
          <Search size={16} color="#8696a0" />
          <input
            type="text"
            placeholder="Search messages in conversation..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentMatchIndex(0);
            }}
            autoFocus
          />
          {searchQuery && (
            <span className="search-match-counter">
              {matchingMessageIndices.length > 0
                ? `${currentMatchIndex + 1} of ${matchingMessageIndices.length}`
                : '0 matches'}
            </span>
          )}
          {matchingMessageIndices.length > 0 && (
            <div className="search-nav-buttons">
              <button
                onClick={() => setCurrentMatchIndex(prev => (prev > 0 ? prev - 1 : matchingMessageIndices.length - 1))}
                title="Previous match"
              >
                <ChevronUp size={16} />
              </button>
              <button
                onClick={() => setCurrentMatchIndex(prev => (prev < matchingMessageIndices.length - 1 ? prev + 1 : 0))}
                title="Next match"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          )}
          <button className="search-close-btn" onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}>
            <X size={16} />
          </button>
        </div>
      )}

      {pinnedMessage && (
        <div style={{
          background: '#fff3cd', borderBottom: '1px solid #ffeeba', padding: '10px 15px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: '#856404', zIndex: 5, boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 'bold', fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              📌 Pinned Message
            </span>
            <span style={{ fontSize: '0.9em' }}>
              {pinnedMessage.imageUrl && '📷 Photo '}
              {pinnedMessage.text && (pinnedMessage.text.length > 50 ? pinnedMessage.text.substring(0, 50) + '...' : pinnedMessage.text)}
            </span>
          </div>
          <button 
            onClick={() => {
              const roomKey = activeChat === 'home' ? 'home_chat' : activeChat;
              socket.emit('pin_message', { messageId: pinnedMessage.id, room: roomKey, unpin: true });
            }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#856404' }}
          >
            &times;
          </button>
        </div>
      )}

      <div 
        className="messages-area"
        ref={messagesContainerRef}
        onScroll={handleScroll}
        onClick={(e) => {
          if (isSelectionMode) {
            // Deselect when tapping/clicking empty space in the messages container
            if (
              e.target === e.currentTarget || 
              e.target.classList.contains('messages-area') || 
              e.target.closest('.chat-empty') || 
              e.target.classList.contains('encrypted-notice')
            ) {
              handleCancelSelection();
            }
          }
        }}
      >
        {activeChat !== 'home' && (
          <div className="encrypted-notice">
            🔒 Messages are private — only you and the other person can see them.
          </div>
        )}

        {currentMessages.length === 0 && (
          <div className="chat-empty">
            <div className="chat-empty-icon">💬</div>
            <div className="chat-empty-title">No messages yet</div>
            <div className="chat-empty-subtitle">
              {activeChat === 'home'
                ? 'Say hello in the public chat!'
                : 'Send a message to start your private conversation.'}
            </div>
          </div>
        )}

        {currentMessages.map((msg, idx) => {
          const isSelf = user && msg.sender === user.username;
          let senderColor = '#333'; // default black/dark-gray for 'other'
          let senderIcon = 'other';
          let senderInfo = null;
          if (!isSelf && msg.sender) {
            senderInfo = users.find(u => u.username === msg.sender || (u.id || u._id) === msg.senderId);
            if (senderInfo) {
              const g = senderInfo.gender ? senderInfo.gender.toLowerCase() : '';
              if (g === 'male') {
                senderColor = '#2196F3'; // blue
                senderIcon = 'male';
              } else if (g === 'female') {
                senderColor = '#E91E63'; // pink
                senderIcon = 'female';
              }
            }
          }
          let msgToPass = msg;
          if (isStrangerChat && !isSelf) {
            msgToPass = { ...msg, sender: 'Stranger' };
            senderColor = '#555';
            senderIcon = 'other';
          }

            return (
              <MessageItem 
                key={msg.id || idx} 
                msg={msgToPass} 
                isSelf={isSelf} 
                isSelfChat={isSelfChat}
                senderUser={senderInfo}
                senderColor={senderColor} 
                senderIcon={senderIcon} 
                onImageClick={setViewingImage} 
                onProfileClick={(profile) => {
                  if (isStrangerChat) return;
                  setViewingProfile(profile);
                }}
                onContextMenu={(e, messageObj) => {
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    msg: messageObj
                  });
                }}
                isSelected={selectedMessageIds.has(msg.id || msg.tempId)}
                isSelectionMode={isSelectionMode}
                onToggleSelect={handleToggleSelect}
                onCancelSelection={handleCancelSelection}
                onReact={handleReaction}
                currentUserId={user?.id || user?._id}
              />
            );
        })}
        <div ref={messagesEndRef} />

        {showScrollBottomBtn && (
          <button 
            className="scroll-bottom-btn" 
            onClick={() => {
              isUserNearBottomRef.current = true;
              setShowScrollBottomBtn(false);
              scrollToBottom('smooth');
            }}
            title="Scroll to latest messages"
          >
            <ChevronDown size={20} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '0 15px', boxSizing: 'border-box' }}>
        {replyingTo && (
          <div style={{ 
            background: '#e0f7fa', padding: '8px 12px', borderTopLeftRadius: '8px', borderTopRightRadius: '8px', 
            borderLeft: '4px solid #00acc1', display: 'flex', justifyContent: 'space-between', 
            alignItems: 'center', color: '#006064', width: '100%', boxSizing: 'border-box',
            marginBottom: '-5px', zIndex: 10
          }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 'bold', fontSize: '0.85em' }}>Replying to {replyingTo.sender}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {replyingTo.imageUrl && <span style={{ fontSize: '0.85em' }}>📷 Photo</span>}
                {replyingTo.text && <span style={{ fontSize: '0.85em' }}>{replyingTo.text.length > 30 ? replyingTo.text.substring(0,30)+'...' : replyingTo.text}</span>}
              </div>
            </div>
            {replyingTo.imageUrl && (
              <img src={replyingTo.imageUrl} alt="preview" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px' }} />
            )}
            <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#00838f' }}>&times;</button>
          </div>
        )}
        <div style={{ width: '100%' }}>
          <MessageInput 
            socket={socket} 
            activeChat={activeChat} 
            isGroup={!!activeGroup} 
            activeGroup={activeGroup}
            onInitiateCall={onInitiateCall} 
            replyingTo={replyingTo} 
            onClearReply={() => setReplyingTo(null)} 
            otherUser={otherUser} 
            onOptimisticMessage={handleOptimisticMessage}
          />
        </div>
      </div>

      {showGroupInfo && activeGroup && (
        <GroupInfoModal 
          group={activeGroup} 
          onClose={() => setShowGroupInfo(false)}
          onGroupUpdated={(updated) => {
            // refresh group details if needed
          }}
          onGroupDeleted={() => {
            setShowGroupInfo(false);
            if (onBackToSidebar) onBackToSidebar();
          }}
          onInitiateCall={onInitiateCall}
        />
      )}

      {showRestartWarning && (
        <RestartWarningModal
          onConfirm={handleRestartChat}
          onCancel={() => setShowRestartWarning(false)}
        />
      )}

      {viewingImage && (
        <ImageViewerModal 
          imageUrl={viewingImage} 
          onClose={() => setViewingImage(null)}
          socket={socket}
          activeChat={activeChat}
          isGroup={!!activeGroup}
          friends={users}
          myGroups={myGroups}
          onInitiateCall={onInitiateCall}
          user={user}
        />
      )}

      {copiedToast && (
        <div className="context-copied-toast">
          <Check size={16} color="#4ade80" />
          <span>Message text copied to clipboard!</span>
        </div>
      )}

      {contextMenu && (() => {
        const msg = contextMenu.msg;
        const isSender = msg.senderId === user?.id || msg.sender === user?.username;
        const isCallLogOrSystem = msg.text && (
          msg.text.startsWith('📞') || 
          msg.text.startsWith('❌') || 
          msg.text.includes('Call') || 
          msg.text.startsWith('📢')
        );
        const isGroupAdmin = activeGroup && activeGroup.myRole === 'admin';
        const canDeleteForEveryone = isSender || isCallLogOrSystem || isSelfChat || isGroupAdmin || activeChat === 'home';

        const handleDeleteForMe = () => {
          const msgId = msg.id;
          const uId = user?.id || user?._id || 'guest';
          if (msgId) {
            try {
              const stored = JSON.parse(localStorage.getItem(`deleted_for_me_${uId}`) || '[]');
              if (!stored.includes(msgId)) {
                stored.push(msgId);
                localStorage.setItem(`deleted_for_me_${uId}`, JSON.stringify(stored));
              }
            } catch (e) {}
          }
          setMessages(prev => {
            const curr = prev[activeChat] || [];
            return {
              ...prev,
              [activeChat]: curr.filter(m => (m.id ? m.id !== msgId : m !== msg))
            };
          });
          setContextMenu(null);
        };

        const handleDeleteForEveryone = () => {
          const roomKey = activeChat === 'home' 
            ? 'home_chat' 
            : (activeGroup ? activeChat : (user ? [user.id, activeChat].sort().join('_') : activeChat));

          if (msg.id) {
            socket.emit('delete_message', { 
              messageId: msg.id, 
              room: roomKey,
              otherUserId: activeChat !== 'home' ? activeChat : null
            });
          }

          setMessages(prev => {
            const curr = prev[activeChat] || [];
            return {
              ...prev,
              [activeChat]: curr.filter(m => (m.id ? m.id !== msg.id : m !== msg))
            };
          });

          setContextMenu(null);
        };

        return (
          <>
            {/* Overlay to close menu when clicking outside */}
            <div 
              className="message-context-overlay"
              onClick={() => setContextMenu(null)} 
              onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }} 
            />
            <div 
              className="message-context-menu"
              style={{
                top: Math.min(Math.max(10, contextMenu.y), window.innerHeight - (canDeleteForEveryone ? 410 : 360)),
                left: Math.min(Math.max(10, contextMenu.x), window.innerWidth - 260),
              }}
            >
              {/* Quick Emoji Reactions */}
              <div className="emoji-reaction-bar">
                {['❤️', '👍', '😂', '😮', '😢', '🙏', '🔥', '🎉'].map(emoji => (
                  <button
                    key={emoji}
                    className="emoji-reaction-btn"
                    onClick={() => {
                      handleReaction(msg.id || msg.tempId, emoji);
                      setContextMenu(null);
                    }}
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* 0. Select Message */}
              <button 
                className="context-menu-item"
                onClick={() => handleStartSelection(msg)}
              >
                <div className="context-menu-icon" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                  <CheckSquare size={16} />
                </div>
                <span>Select message</span>
              </button>

              {/* 1. Reply */}
              <button 
                className="context-menu-item"
                onClick={() => { setReplyingTo(msg); setContextMenu(null); }}
              >
                <div className="context-menu-icon reply">
                  <Reply size={16} />
                </div>
                <span>Reply</span>
              </button>

              {/* 2. Forward */}
              <button 
                className="context-menu-item"
                onClick={() => { setForwardMsg(msg); setContextMenu(null); }}
              >
                <div className="context-menu-icon forward">
                  <CornerUpRight size={16} />
                </div>
                <span>Forward</span>
              </button>

              {/* 3. Copy */}
              {msg.text && (
                <button 
                  className="context-menu-item"
                  onClick={() => {
                    const textToCopy = msg.text;
                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(textToCopy);
                    } else {
                      const el = document.createElement('textarea');
                      el.value = textToCopy;
                      document.body.appendChild(el);
                      el.select();
                      try { document.execCommand('copy'); } catch(e) {}
                      document.body.removeChild(el);
                    }
                    setCopiedToast(true);
                    setTimeout(() => setCopiedToast(false), 2000);
                    setContextMenu(null);
                  }}
                >
                  <div className="context-menu-icon copy">
                    <Copy size={16} />
                  </div>
                  <span>Copy</span>
                </button>
              )}

              {/* 4. Pin */}
              <button 
                className="context-menu-item"
                onClick={() => {
                  const roomKey = activeChat === 'home' 
                    ? 'home_chat' 
                    : (activeGroup ? activeChat : (user ? [user.id, activeChat].sort().join('_') : activeChat));
                  
                  if (msg.id) {
                    socket.emit('pin_message', { 
                      messageId: msg.id, 
                      room: roomKey, 
                      roomKey: activeChat,
                      otherUserId: activeChat !== 'home' ? activeChat : null 
                    });
                  }

                  // Optimistically toggle pin locally
                  setMessages(prev => {
                    const curr = prev[activeChat] || [];
                    return {
                      ...prev,
                      [activeChat]: curr.map(m => m.id === msg.id ? { ...m, is_pinned: !m.is_pinned } : m)
                    };
                  });
                  
                  setContextMenu(null);
                }}
              >
                <div className="context-menu-icon pin">
                  {msg.is_pinned ? <PinOff size={16} /> : <Pin size={16} />}
                </div>
                <span>{msg.is_pinned ? 'Unpin message' : 'Pin message'}</span>
              </button>

              {/* 5. Save to Gallery / Image download */}
              {msg.imageUrl && (
                <button 
                  className="context-menu-item"
                  onClick={() => {
                    fetch(msg.imageUrl)
                      .then(res => res.blob())
                      .then(blob => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `image-${Date.now()}.jpg`;
                        document.body.appendChild(a);
                        a.click();
                        window.URL.revokeObjectURL(url);
                        document.body.removeChild(a);
                      })
                      .catch(err => console.error("Download failed:", err));
                    setContextMenu(null);
                  }}
                >
                  <div className="context-menu-icon download">
                    <Download size={16} />
                  </div>
                  <span>Save to Gallery</span>
                </button>
              )}

              {/* Delete Options Divider */}
              <div className="context-menu-divider" />

              {/* 6. Delete for Me */}
              <button 
                className="context-menu-item danger"
                onClick={handleDeleteForMe}
              >
                <div className="context-menu-icon delete">
                  <Trash2 size={16} />
                </div>
                <span>Delete for me</span>
              </button>

              {/* 7. Delete for Everyone */}
              {canDeleteForEveryone && (
                <button 
                  className="context-menu-item danger"
                  onClick={handleDeleteForEveryone}
                >
                  <div className="context-menu-icon delete" style={{ background: 'rgba(239, 68, 68, 0.22)', color: '#ef4444' }}>
                    <Users size={16} />
                  </div>
                  <span>Delete for everyone</span>
                </button>
              )}
            </div>
          </>
        );
      })()}

      {forwardMsg && (
        <ForwardModal 
          forwardMsg={forwardMsg}
          friends={users}
          myGroups={myGroups}
          onClose={() => setForwardMsg(null)}
          onSend={(selectedIds) => {
            selectedIds.forEach(targetId => {
              const isTargetGroup = (Array.isArray(myGroups) ? myGroups : []).some(g => g.id === targetId);
              const baseData = {
                sender: user ? user.username : 'Guest',
                senderId: user ? user.id : null,
                timestamp: new Date().toISOString(),
                text: forwardMsg.text || '',
                imageUrl: forwardMsg.imageUrl || null,
                stickerUrl: forwardMsg.stickerUrl || null,
                gifUrl: forwardMsg.gifUrl || null,
                viewOnce: false
              };
              if (isTargetGroup) {
                socket.emit('send_group_message', { ...baseData, room: targetId });
              } else {
                const room = user ? [user.id, targetId].sort().join('_') : targetId;
                socket.emit('send_private_message', { ...baseData, room, recipientId: targetId });
              }
            });
            setForwardMsg(null);
          }}
        />
      )}

      {pendingCall && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setPendingCall(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center', padding: '24px', maxWidth: '320px' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--brand-900)' }}>Start {pendingCall === 'video' ? 'Video' : 'Voice'} Call?</h3>
            <p style={{ marginBottom: '25px', color: 'var(--neutral-600)', fontSize: '0.95rem' }}>
              Are you sure you want to call this user?
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setPendingCall(null)}
                style={{ padding: '10px 24px', background: 'transparent', border: '1px solid var(--neutral-300)', borderRadius: '24px', color: 'var(--neutral-700)', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onInitiateCall(pendingCall);
                  setPendingCall(null);
                }}
                style={{ padding: '10px 24px', background: 'var(--brand-500)', border: 'none', borderRadius: '24px', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', boxShadow: 'var(--shadow-brand)' }}
              >
                {pendingCall === 'video' ? <Video size={18} /> : <Phone size={18} />} Call
              </button>
            </div>
          </div>
        </div>
      )}

      {showGroupInfo && activeGroup && (
        <GroupInfoModal
          group={activeGroup}
          initialAddMode={groupMenuAddMode}
          onClose={() => {
            setShowGroupInfo(false);
            setGroupMenuAddMode(false);
          }}
          onGroupUpdated={(updated) => {
            if (setMyGroups) {
              setMyGroups(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g));
            }
          }}
          onGroupDeleted={(deletedId) => {
            if (setMyGroups) {
              setMyGroups(prev => prev.filter(g => g.id !== deletedId));
            }
            if (onBackToSidebar) onBackToSidebar();
          }}
          onInitiateCall={(callType) => {
            setShowGroupInfo(false);
            if (onInitiateGroupCall) {
              onInitiateGroupCall(activeGroup.id, activeGroup.name, callType);
            }
          }}
        />
      )}

      {viewingProfile && (
        <ProfileViewer 
          userProfile={viewingProfile} 
          onClose={() => setViewingProfile(null)} 
        />
      )}
    </div>
  );
};

export default ChatBox;
