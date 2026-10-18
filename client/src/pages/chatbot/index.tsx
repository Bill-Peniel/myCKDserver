import React, { useState, useEffect } from 'react';
import { ArrowUp, Activity, FlaskConical, Pill, RotateCcw, Salad, Sparkles } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/kit';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  {
    icon: Activity,
    title: 'Interpréter un DFG',
    prompt: 'Comment interpréter un DFG de 38 mL/min/1,73 m² chez un patient de 62 ans, et quel suivi proposer ?',
  },
  {
    icon: FlaskConical,
    title: 'Hyperkaliémie en MRC',
    prompt: "Quelle conduite à tenir devant une kaliémie à 5,9 mmol/L chez un patient en stade 4 ?",
  },
  {
    icon: Pill,
    title: 'Adapter un traitement',
    prompt: 'Quels médicaments courants faut-il adapter ou éviter quand le DFG est inférieur à 30 mL/min ?',
  },
  {
    icon: Salad,
    title: 'Conseils nutritionnels',
    prompt: 'Quels conseils diététiques donner à un patient en stade 3B (sel, protéines, potassium) ?',
  },
];

/** Gras **texte** en ligne */
function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') && part.length > 4 ? (
      <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    ),
  );
}

/** Rendu léger : paragraphes, retours à la ligne, listes à puces / numérotées, titres « ## » */
function MessageContent({ content }: { content: string }) {
  const blocks = content.replace(/\r\n/g, '\n').split(/\n{2,}/);
  return (
    <div className="space-y-3">
      {blocks.map((block, bi) => {
        const lines = block.split('\n').filter((l) => l.trim() !== '');
        if (lines.length === 0) return null;
        const isBullet = lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isBullet) {
          const ordered = /^\s*\d+[.)]/.test(lines[0]);
          const Tag = ordered ? 'ol' : 'ul';
          return (
            <Tag key={bi} className={cn('space-y-1 pl-5', ordered ? 'list-decimal' : 'list-disc', 'marker:text-muted-foreground')}>
              {lines.map((l, li) => (
                <li key={li} className="pl-1">{renderInline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</li>
              ))}
            </Tag>
          );
        }
        if (lines.length === 1 && /^#{1,4}\s+/.test(lines[0])) {
          return (
            <p key={bi} className="font-semibold text-foreground">{renderInline(lines[0].replace(/^#{1,4}\s+/, ''))}</p>
          );
        }
        return (
          <p key={bi} className="whitespace-pre-wrap">
            {renderInline(lines.join('\n'))}
          </p>
        );
      })}
    </div>
  );
}

function AssistantAvatar() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
      <Sparkles className="h-3.5 w-3.5" />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3" aria-live="polite" aria-label="L'assistant est en train d'écrire">
      <AssistantAvatar />
      <div className="flex h-9 items-center gap-1 rounded-2xl rounded-tl-md border bg-muted/50 px-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/70"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
          />
        ))}
      </div>
    </div>
  );
}

export default function ChatbotPage() {
  const [input, setInput] = useState('');
  const { isAuthenticated, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem('chatMessages');
      return savedMessages ? JSON.parse(savedMessages) : [];
    }
    return [];
  });

  // Effacer l'historique quand l'utilisateur se déconnecte
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.removeItem('chatMessages');
      setMessages([]);
    }
  }, [isAuthenticated]);

  // Sauvegarder les messages quand ils changent
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      return apiRequest('POST', '/api/chatbot', { message });
    },
    onSuccess: async (response) => {
      try {
        const data = await response.json();
        if (data?.message) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
        }
      } catch (error) {
        console.error('Error processing response:', error);
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || 'Une erreur est survenue';
      setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
    }
  });

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  // Défilement automatique quand les messages changent
  useEffect(() => {
    scrollToBottom();
  }, [messages, sendMessage.isPending]);

  // Hauteur automatique de la zone de saisie
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [input]);

  const send = (text: string) => {
    if (!text.trim() || sendMessage.isPending) return;
    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(text);
    setInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send(input);
    }
  };

  const handleNewConversation = () => {
    localStorage.removeItem('chatMessages');
    setMessages([]);
    setInput('');
    textareaRef.current?.focus();
  };

  const empty = messages.length === 0;

  return (
    <div className="flex h-[calc(100dvh-3.5rem-3rem)] min-h-[480px] flex-col gap-4 lg:h-[calc(100dvh-3.5rem-4rem)]">
      {/* En-tête compact */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <Sparkles className="h-[18px] w-[18px]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">Assistant IA</h1>
            <p className="truncate text-xs text-muted-foreground">Aide à la décision en néphrologie</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleNewConversation} disabled={empty && !input}>
          <RotateCcw /> <span className="hidden sm:inline">Nouvelle conversation</span>
        </Button>
      </div>

      {/* Zone de conversation */}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-card">
        <div className="flex-1 overflow-y-auto">
          {empty ? (
            <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center justify-center px-4 py-8 text-center sm:py-10">
              <div className="relative mb-5">
                <div className="absolute inset-0 -m-4 rounded-full bg-primary/10 blur-xl" />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-float">
                  <Sparkles className="h-5 w-5" />
                </div>
              </div>
              <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                Comment puis-je vous aider{user?.lastName ? `, Dr. ${user.lastName}` : ''} ?
              </h2>
              <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
                Posez une question clinique sur la maladie rénale chronique : interprétation biologique, traitements, suivi.
              </p>
              <div className="mt-6 grid w-full gap-2 sm:mt-8 sm:grid-cols-2 sm:gap-2.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s.title}
                    type="button"
                    onClick={() => send(s.prompt)}
                    className="group flex items-center gap-3 rounded-xl border bg-background p-3 sm:items-start sm:p-3.5 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-float focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <s.icon className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-medium text-foreground">{s.title}</span>
                      <span className="mt-0.5 line-clamp-2 hidden text-xs text-muted-foreground sm:block">{s.prompt}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
              {messages.map((msg, i) =>
                msg.role === 'user' ? (
                  <div key={i} className="flex items-start justify-end gap-3">
                    <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground shadow-sm sm:max-w-[75%]">
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <UserAvatar firstName={user?.firstName} lastName={user?.lastName} size="xs" className="mt-0.5 hidden h-7 w-7 sm:inline-flex" />
                  </div>
                ) : (
                  <div key={i} className="flex items-start gap-3">
                    <AssistantAvatar />
                    <div className="min-w-0 max-w-[85%] break-words pt-0.5 text-sm leading-relaxed text-foreground/90 sm:max-w-[80%]">
                      <MessageContent content={msg.content} />
                    </div>
                  </div>
                ),
              )}
              {sendMessage.isPending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Saisie */}
        <div className="border-t bg-card/80 px-3 pb-3 pt-3 backdrop-blur sm:px-4">
          <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-input bg-background p-1.5 pl-4 shadow-xs transition-[box-shadow,border-color] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Posez votre question…"
                aria-label="Votre message"
                className="max-h-[200px] min-h-[36px] flex-1 resize-none bg-transparent py-2 text-sm leading-5 text-foreground placeholder:text-muted-foreground/80 focus:outline-none"
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-xl"
                disabled={sendMessage.isPending || !input.trim()}
                aria-label="Envoyer"
              >
                <ArrowUp />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground">
              L'assistant peut se tromper, vérifiez les informations médicales.
              <span className="hidden sm:inline"> · <kbd className="font-sans">Entrée</kbd> pour envoyer, <kbd className="font-sans">Maj + Entrée</kbd> pour une nouvelle ligne</span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
