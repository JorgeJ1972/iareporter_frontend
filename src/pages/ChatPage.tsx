import React, { useState, useRef, useEffect } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import './ChatPage.css';
import { useTranslation } from 'react-i18next';
import { useGlobal } from '../context/GlobalContext';
import { chatService } from '../services/chatService';
import { ApiConversation, ApiMessage } from '../types/chatApi';
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import { Tooltip } from 'primereact/tooltip';
import { tablesGroupService } from '../services/tablesGroupService';
import { TableGroup } from '../types/tableGroupt';
import i18n from '../i18next';

// Tipos para los mensajes
type Message = {
  id: number;
  text: string;
  sender: 'user' | 'ai' | 'status';
  data_response?: any;
  attachments?: Attachment[];
  query?: string | null;
};

// Tipo para los adjuntos, basado en la respuesta de la API
type Attachment = {
  type: string;
  name: string;
  path: string; // El campo 'icono' ya no es necesario, lo determinamos en el frontend
};

// Tipo para los items del historial
type ChatHistoryItem = {
  id: string; // ID local para el historial en el UI
  conversation_id: number | undefined; // ID de la conversación del backend (si existe)
  title: string;
};

// Función auxiliar para obtener el ícono de PrimeReact según el tipo de archivo
const getIconForAttachment = (attachmentType: string): string => {
  // Usamos un switch para devolver la clase de PrimeIcon correspondiente.
  // Es una buena práctica manejar el caso por defecto.
  switch (attachmentType?.toUpperCase()) {
    case 'EXCEL':
      return 'pi pi-file-excel';
    case 'PDF':
      return 'pi pi-file-pdf';
    case 'WORD':
      return 'pi pi-file-word';
    // Puedes añadir más tipos según necesites (ej. 'IMAGE', 'ZIP', etc.)
    default:
      return 'pi pi-file'; // Ícono genérico para otros tipos
  }
};

// Componente auxiliar para encapsular la lógica de copiado del markdown
const MarkdownContent: React.FC<{ content: string }> = ({ content }) => {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);
  const buttonRef = useRef(null);

  // Una comprobación más específica para tablas Markdown
  const hasTable = content.includes('|') && content.includes('---');

  const handleCopy = () => {
    // Convierte la tabla Markdown a un formato TSV (Tab-Separated Values) para Excel
    const tsv = content
      .split('\n') // Divide el contenido en líneas
      .filter(line => line.trim() !== '' && !line.includes('---') && !line.trim().startsWith('*...')) // Filtra líneas vacías, separadores y resúmenes
      .map(line => 
        line
          .split('|') // Divide cada fila por el separador de celda '|'
          .slice(1, -1) // Elimina los elementos vacíos al principio y al final
          .map(cell => cell.trim()) // Limpia los espacios en blanco de cada celda
          .join('\t') // Une las celdas con un tabulador
      )
      .join('\n'); // Une las filas con un salto de línea

    navigator.clipboard.writeText(tsv).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // El icono vuelve a la normalidad tras 2 segundos
    });
  };

  return (
    <div className="markdown-wrapper">
      {hasTable && (
        <>
          <Tooltip target={buttonRef} />
          <Button
            ref={buttonRef}
            icon={isCopied ? 'pi pi-check' : 'pi pi-copy'}
            className="p-button-text p-button-sm copy-button"
            onClick={handleCopy}
            data-pr-tooltip={isCopied ? t('chat.copied') : t('chat.copy')}
            data-pr-position="left"
          />
        </>
      )}
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
};

// Componente para la pantalla de bienvenida cuando no hay chat activo
const WelcomeScreen: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div className="chat-welcome-container">
      <i className="pi pi-comments welcome-icon" />
      <h2>{t('chat.welcomeTitle')}</h2>
      <p>{t('chat.welcomeMessage')}</p>
    </div>
  );
};

const ChatPage: React.FC = () => {
  const { t } = useTranslation();
  const { toastRef, setBlocked } = useGlobal();
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // State Management: allChats is the single source of truth.
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [allChats, setAllChats] = useState<Record<string, Message[]>>({});
  const [conversations, setConversations] = useState<Record<string, ApiConversation>>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  
  // Derived state for active chat messages. No separate useState.
  const messages = activeChatId ? allChats[activeChatId] || [] : [];

  const [tablesGroup, setTablesGroup] = useState<TableGroup[]>([]);
  const [selectedTablesGroup, setSelectedTablesGroup] = useState<number | null>(null);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const checkSize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarVisible(false);
      } else {
        setIsSidebarVisible(true);
      }
    };

    window.addEventListener('resize', checkSize);
    checkSize();

    return () => window.removeEventListener('resize', checkSize);
  }, []);

  useEffect(() => {
    const fetchTablesGroups = async () => {
      try {
        setBlocked(true);
        const response = await tablesGroupService.getByUserId(2);
        if (response.result) {
          setTablesGroup(response.result);
        }
      } catch (error) {
        toastRef.current?.show({ severity: 'error', summary: t('common.errorSummary'), detail: t('chat.errors.loadTablesGroups') });
      } finally {
        setBlocked(false);
      }
    };
    fetchTablesGroups();
  }, [setBlocked, t, toastRef]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleNewChat = async () => {
    try {
      setBlocked(true);
      if (!selectedTablesGroup) {
        toastRef.current?.show({ severity: 'warn', summary: t('common.errorSummary'), detail: t('chat.errors.selectTablesGroupFirst') });
        return;
      }
      const response = await chatService.createCoversation(selectedTablesGroup, i18n.language);
      const newConversation = response.result!;
      const localChatId = Date.now().toString();

      const newHistoryItem: ChatHistoryItem = {
        id: localChatId,
        conversation_id: newConversation.conversation_id,
        title: t('chat.newChat'),
      };

      const newMessages: Message[] = newConversation.messages.map((msg, index) => ({
        id: Date.now() + index,
        text: msg.text,
        sender: msg.type === 'B' ? 'ai' : 'user',
        data_response: msg.data_response,
        attachments: msg.attachments,
      }));

      setHistory(prev => [newHistoryItem, ...prev]);
      setAllChats(prev => ({ ...prev, [localChatId]: newMessages }));
      setConversations(prev => ({ ...prev, [localChatId]: newConversation }));
      setActiveChatId(localChatId);
      setInputValue('');
    } catch (error) {
      toastRef.current?.show({ severity: 'error', summary: t('common.errorSummary'), detail: t('chat.errors.createConversation') });
    } finally {
      setBlocked(false);
    }
  };

  const handleSelectChat = (chatId: string) => {
    if (isTyping) return;
    setActiveChatId(chatId);
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '' || !activeChatId) return;

    const currentInput = inputValue;
    setInputValue('');

    const userMessage: Message = {
      id: Date.now(),
      text: currentInput,
      sender: 'user',
    };

    const activeHistoryItem = history.find(item => item.id === activeChatId);
    if (activeHistoryItem && activeHistoryItem.title === t('chat.newChat')) {
      const newTitle = currentInput.length > 35 ? currentInput.substring(0, 32) + '...' : currentInput;
      setHistory(prevHistory =>
        prevHistory.map(item =>
          item.id === activeChatId ? { ...item, title: newTitle } : item
        )
      );
    }

    setAllChats(prev => ({ ...prev, [activeChatId!]: [...(prev[activeChatId!] || []), userMessage] }));
    setIsTyping(true);

    const baseConversation = conversations[activeChatId];
    if (!baseConversation) {
      toastRef.current?.show({ severity: 'error', summary: t('common.errorSummary'), detail: t('chat.errors.noActiveConversation') });
      setIsTyping(false);
      return;
    }

    // Reconstruct the message history from the UI state (`allChats`) to ensure it's up-to-date
    const historyMessages: ApiMessage[] = (allChats[activeChatId] || []).map((msg): ApiMessage => ({
      text: msg.text,
      type: msg.sender === 'user' ? 'U' : 'B',
      voice: false,
      language: i18n.language,
      attachments: msg.attachments || [],
      data_response: msg.data_response || {},
      query: msg.query || "",
      columns: [],
      graphics: [],
      status: 'completed',
      created: new Date(msg.id).toISOString(), // Use message ID for a more stable timestamp
      received: new Date(msg.id).toISOString(),
    }));

    // Find the last query from an AI message to forward it if the user confirms a download
    const chatHistory = allChats[activeChatId] || [];
    let lastAiQuery: string | null = null;
    // Iterate backwards to find the most recent AI message with a query
    for (let i = chatHistory.length - 1; i >= 0; i--) {
      const msg = chatHistory[i];
      if (msg.sender === 'ai' && msg.query) {
        lastAiQuery = msg.query;
        break; // Found the latest query, no need to look further
      }
    }

    let queryToAttach: string | null = null;
    // Check if the user's input matches a download confirmation (e.g., "yes", "excel", "download")
    const isDownloadConfirmation = /excel|word|pdf|descargar|s[ií]/.test(currentInput.toLowerCase());
    if (isDownloadConfirmation && lastAiQuery) {
      queryToAttach = lastAiQuery;
    }

    const newMessageApi: ApiMessage = {
      text: currentInput,
      type: 'U',
      voice: false,
      language: i18n.language,
      attachments: [],
      data_response: {},
      query: queryToAttach || "", // Attach the found query to the new message
      columns: [],
      graphics: [],
      status: "pending",
      created: new Date().toISOString(),
      received: new Date().toISOString(),
    };

    const conversationPayload: ApiConversation = {
      ...baseConversation,
      messages: historyMessages, // Send the full history
    };

    let aiText = "";
    let receivedQuery: string | null = null; // Use local var to avoid state race conditions
    
    await chatService.streamMessage(
      {
        message: newMessageApi,
        conversation: conversationPayload
      },
      (event) => {
        switch (event.type) {
          case 'status':
            setStatusText(event.value);
            break;
          case 'token':
            if (statusText) setStatusText(null);
            aiText += event.value;
            setAllChats(prev => {
              const currentMessages = prev[activeChatId!] || [];
              const lastMessage = currentMessages[currentMessages.length - 1];
              if (lastMessage && lastMessage.sender === 'ai') {
                const updatedMessages = currentMessages.map((msg, idx) =>
                  idx === currentMessages.length - 1 ? { ...msg, text: aiText } : msg
                );
                return { ...prev, [activeChatId!]: updatedMessages };
              } else {
                return { ...prev, [activeChatId!]: [...currentMessages, { id: Date.now(), text: aiText, sender: 'ai' }] };
              }
            });
            break;
          case 'table':
            if (statusText) setStatusText(null);
            aiText += '\n\n' + event.value;
            setAllChats(prev => {
              const currentMessages = prev[activeChatId!] || [];
              const lastMessage = currentMessages[currentMessages.length - 1];
              if (lastMessage && lastMessage.sender === 'ai') {
                const updatedMessages = currentMessages.map((msg, idx) =>
                  idx === currentMessages.length - 1 ? { ...msg, text: aiText } : msg
                );
                return { ...prev, [activeChatId!]: updatedMessages };
              } else {
                return { ...prev, [activeChatId!]: [...currentMessages, { id: Date.now(), text: aiText, sender: 'ai' }] };
              }
            });
            break;
          case 'attachment':
            if (statusText) setStatusText(null);
            setAllChats(prev => {
              const currentMessages = prev[activeChatId!] || [];
              const lastMessage = currentMessages[currentMessages.length - 1];
              if (lastMessage && lastMessage.sender === 'ai') {
                // Add the new attachment to the existing ones
                const updatedAttachments = [...(lastMessage.attachments || []), event.value];
                const updatedMessages = currentMessages.map((msg, idx) =>
                  idx === currentMessages.length - 1 ? { ...msg, attachments: updatedAttachments } : msg
                );
                return { ...prev, [activeChatId!]: updatedMessages };
              } else {
                // Fallback: If there's no AI message, create one with the attachment
                return { ...prev, [activeChatId!]: [...currentMessages, { id: Date.now(), text: '', sender: 'ai', attachments: [event.value] }] };
              }
            });
            break;
          case 'query':
            receivedQuery = event.value; // Assign to local var
            break;
          case 'end':
            if (receivedQuery) { // Check local var
              setAllChats(prev => {
                const currentMessages = prev[activeChatId!] || [];
                const lastMessage = currentMessages[currentMessages.length - 1];
                if (lastMessage && lastMessage.sender === 'ai') {
                  const updatedMessages = [
                    ...currentMessages.slice(0, -1),
                    { ...lastMessage, query: receivedQuery } // Use local var
                  ];
                  return { ...prev, [activeChatId!]: updatedMessages };
                }
                return prev;
              });
            }
            setIsTyping(false);
            setStatusText(null);
            break;
          case 'error':
            toastRef.current?.show({ severity: 'error', summary: t('common.errorSummary'), detail: event.value });
            setIsTyping(false);
            setStatusText(null);
            break;
        }
      },
      () => {
          setIsTyping(false)
          setStatusText(null);
      },
      (error) => {
        toastRef.current?.show({ severity: 'error', summary: t('common.errorSummary'), detail: t('chat.errors.sendMessage') });
        setIsTyping(false);
        setStatusText(null);
      }
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isTyping && inputValue.trim()) {
      handleSendMessage();
    }
  };

  return (
    <div className={`chat-page-layout ${!isSidebarVisible ? 'sidebar-collapsed' : ''}`}>
      <Tooltip target=".sidebar-toggle-button" />
      <Button
        icon={isSidebarVisible ? 'pi pi-angle-left' : 'pi pi-bars'}
        className="p-button-text p-button-rounded sidebar-toggle-button"
        onClick={() => setIsSidebarVisible(!isSidebarVisible)}
        data-pr-tooltip={isSidebarVisible ? t('chat.hideSidebar') : t('chat.showSidebar')}
        data-pr-position="right"
      />

      <div className="chat-sidebar">
        <div className="tables-group-selector">
          <label htmlFor="tg-dropdown">{t('chat.selectTablesGroup')}</label>
          <Dropdown
            id="tg-dropdown"
            value={selectedTablesGroup}
            options={tablesGroup}
            onChange={(e) => setSelectedTablesGroup(e.value)}
            optionLabel="name"
            optionValue="id"
            placeholder={t('chat.selectTablesGroupPlaceholder')}
            className="w-full"
            disabled={isTyping}
          />
        </div>
        <div className="sidebar-header">
          <Button
            label={t('chat.newChat')}
            icon="pi pi-plus"
            className="p-button-secondary p-button-sm new-chat-button"
            onClick={handleNewChat} disabled={!selectedTablesGroup || isTyping}
          />
        </div>
        <div className="history-list">
          {history.map(item => (
            <div
              key={item.id}
              className={`history-item ${item.id === activeChatId ? 'active' : ''}`}
              onClick={() => handleSelectChat(item.id)}
              title={item.title}
            >
              <span className="pi pi-comments history-icon"></span>
              <span className="history-title">{item.title}</span>
            </div>
          ))}
        </div>
      </div>
      {activeChatId ? (
        <div className="chat-container">
          <div className="chat-messages">
            {messages.map(message => (
              <div key={message.id} className={`message-bubble ${message.sender}`}>
                {message.sender === 'ai' ? (
                  <>
                    <MarkdownContent content={message.text} />
                    {message.attachments && message.attachments.length > 0 && (
                      <div className="attachments-container">
                        {message.attachments.map((att, index) => (
                          <a
                            key={index}
                            href={att.path}
                            download={att.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="attachment-link"
                            data-pr-tooltip={t('chat.downloadFile', { fileName: att.name })}
                            data-pr-position="bottom"
                          >
                            <i className={`attachment-icon ${getIconForAttachment(att.type)}`}></i>
                            <span>{att.name}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </>
                ) : message.sender === 'status' ? (
                  <div className="status-message">
                    <span className="status-text">{message.text}</span>
                  </div>
                ) : (<p>{message.text}</p>)}
              </div>
            ))}
            {statusText && (
              <div className="message-bubble status">
                <div className="status-message">
                    <span className="status-text">{statusText}</span>
                </div>
              </div>
            )}
            {isTyping && (
              <div className="message-bubble ai">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="chat-input-area">
            <InputText value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={handleKeyPress} placeholder={t('chat.placeholder')} className="chat-input" disabled={isTyping} />
            <Button icon="pi pi-send" className="p-button-rounded p-button-primary chat-send-button" onClick={handleSendMessage} disabled={isTyping || !inputValue.trim()} />
          </div>
        </div>
      ) : (
        <WelcomeScreen />
      )}
    </div>
  );
};

export default ChatPage;
