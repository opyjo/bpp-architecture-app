"use client";

import { useRef, useEffect, useState } from "react";
import { useChat } from "@/lib/hooks/useChat";
import { useSavedChats } from "@/lib/hooks/useSavedChats";
import { useSpeech } from "@/lib/hooks/useSpeech";
import { DEFAULT_MODEL_ID } from "@/lib/ai/models";
import MessageBubble from "@/components/ai/MessageBubble";
import ChatInput from "@/components/ai/ChatInput";
import ModelSelector from "@/components/ai/ModelSelector";
import { Save, ExternalLink, Mic, MicOff, Volume2, VolumeX, X, Send } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { bsaCoachSystemContext } from "@/data/bsa-cheatsheet";

const MOCK_INTERVIEW_PROMPT = "Mock interview — 5 BSA questions";

const COACH_PROMPTS = [
  MOCK_INTERVIEW_PROMPT,
  "How do I gather integration requirements?",
  "Explain the saga pattern simply",
  "Bell project examples for behavioral Qs",
];

export default function InterviewCoachTab() {
  const [modelId, setModelId] = useState(DEFAULT_MODEL_ID);
  const { messages, isStreaming, error, sendMessage, stopStreaming, clearHistory } =
    useChat(modelId, {
      storageKey: "bsa-coach-chat",
      systemContext: bsaCoachSystemContext,
    });
  const { saveChat } = useSavedChats();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showSavePopover, setShowSavePopover] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saveFeedback, setSaveFeedback] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // --- Voice mock interview ---
  const {
    supported,
    listening,
    startListening,
    stopListening,
    speaking,
    speak,
    cancelSpeak,
  } = useSpeech();
  const voiceSupported = supported.recognition || supported.synthesis;

  const [speakResponses, setSpeakResponses] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");

  // Track streaming transitions so we can speak completed assistant turns.
  const prevStreamingRef = useRef(isStreaming);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Speak the latest assistant message when a stream finishes (true -> false).
  useEffect(() => {
    const wasStreaming = prevStreamingRef.current;
    prevStreamingRef.current = isStreaming;

    // A new stream started -> stop any in-flight narration.
    if (!wasStreaming && isStreaming) {
      cancelSpeak();
      return;
    }

    if (wasStreaming && !isStreaming && speakResponses && supported.synthesis) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant" && last.content.trim()) {
        speak(last.content);
      }
    }
  }, [isStreaming, messages, speakResponses, supported.synthesis, speak, cancelSpeak]);

  // Toggling Speak-responses OFF stops narration immediately.
  const toggleSpeakResponses = () => {
    setSpeakResponses((on) => {
      if (on) cancelSpeak();
      return !on;
    });
  };

  const toggleMic = () => {
    if (listening) {
      stopListening();
      return;
    }
    setInterim("");
    startListening(
      (finalText) => {
        setInterim("");
        setTranscript((prev) => (prev ? `${prev} ${finalText}`.trim() : finalText));
      },
      (interimText) => setInterim(interimText)
    );
  };

  const sendTranscript = () => {
    const text = transcript.trim();
    if (!text || isStreaming) return;
    if (listening) stopListening();
    sendMessage(text);
    setTranscript("");
    setInterim("");
  };

  const clearTranscript = () => {
    if (listening) stopListening();
    setTranscript("");
    setInterim("");
  };

  const startMockInterview = () => {
    if (isStreaming) return;
    if (supported.synthesis) setSpeakResponses(true);
    sendMessage(MOCK_INTERVIEW_PROMPT);
  };

  const showTranscriptBar = listening || transcript.length > 0 || interim.length > 0;

  const isEmpty = messages.length === 0;

  const handleSaveClick = () => {
    const firstUserMsg = messages.find((m) => m.role === "user");
    setSaveTitle(
      firstUserMsg
        ? firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? "\u2026" : "")
        : "Untitled"
    );
    setShowSavePopover(true);
  };

  const handleSaveConfirm = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const rawTitle = saveTitle.trim() || "Untitled";
    const finalTitle = rawTitle.startsWith("[BSA Coach]") ? rawTitle : `[BSA Coach] ${rawTitle}`;
    try {
      await saveChat({
        title: finalTitle,
        messages,
        model_id: modelId,
      });
      setShowSavePopover(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2000);
    } catch {
      toast.error("Failed to save chat");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-arch-border bg-arch-bg2/80 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-arch-teal to-arch-blue text-white flex items-center justify-center text-[8px] font-bold shrink-0">
            BSA
          </div>
          <span className="text-[13px] font-semibold text-arch-text truncate">
            Interview Coach
          </span>
          <ModelSelector
            value={modelId}
            onChange={setModelId}
            disabled={isStreaming}
          />
        </div>
        <div className="flex items-center gap-1">
          {voiceSupported ? (
            <>
              {supported.recognition && (
                <button
                  onClick={toggleMic}
                  title={listening ? "Stop voice input" : "Answer by voice"}
                  className={cn(
                    "flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors cursor-pointer",
                    listening
                      ? "text-arch-coral bg-arch-coral/10 hover:bg-arch-coral/20"
                      : "text-arch-text3 hover:text-arch-teal hover:bg-white/5"
                  )}
                >
                  {listening ? <Mic className="w-3 h-3" /> : <MicOff className="w-3 h-3" />}
                  {listening ? "Listening" : "Voice"}
                </button>
              )}
              {supported.synthesis && (
                <button
                  onClick={toggleSpeakResponses}
                  title={speakResponses ? "Mute spoken responses" : "Speak responses aloud"}
                  className={cn(
                    "flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors cursor-pointer",
                    speakResponses
                      ? "text-arch-purple bg-arch-purple/10 hover:bg-arch-purple/20"
                      : "text-arch-text3 hover:text-arch-purple hover:bg-white/5"
                  )}
                >
                  {speakResponses ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
                  {speaking ? "Speaking" : "Speak"}
                </button>
              )}
              <div className="w-px h-4 bg-arch-border mx-0.5" />
            </>
          ) : (
            <span className="text-[10.5px] text-arch-text3 px-2 py-1 italic">
              Voice unavailable in this browser
            </span>
          )}
          <Link
            href="/saved"
            className="text-[11px] text-arch-text3 hover:text-arch-teal transition-colors px-2 py-1 rounded hover:bg-white/5 flex items-center gap-1"
          >
            Saved chats <ExternalLink className="w-3 h-3" />
          </Link>
          {messages.length > 0 && (
            <>
              <button
                onClick={handleSaveClick}
                disabled={isStreaming}
                className="text-[11px] text-arch-text3 hover:text-arch-green transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer flex items-center gap-1 disabled:opacity-40"
              >
                <Save className="w-3 h-3" />
                {saveFeedback ? "Saved!" : "Save chat"}
              </button>
              <button
                onClick={clearHistory}
                className="text-[11px] text-arch-text3 hover:text-arch-red transition-colors px-2 py-1 rounded hover:bg-white/5 cursor-pointer"
              >
                Clear chat
              </button>
            </>
          )}
        </div>
      </div>

      {/* Save popover */}
      {showSavePopover && (
        <div className="mx-4 mt-2 px-3 py-2.5 rounded-lg bg-arch-bg2 border border-arch-border flex items-center gap-2">
          <input
            type="text"
            value={saveTitle}
            onChange={(e) => setSaveTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveConfirm();
              if (e.key === "Escape") setShowSavePopover(false);
            }}
            placeholder="Chat title\u2026"
            autoFocus
            className="flex-1 bg-transparent text-[12px] text-arch-text outline-none placeholder:text-arch-text3"
          />
          <button
            onClick={handleSaveConfirm}
            disabled={isSaving}
            className="text-[11px] text-arch-green hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-40"
          >
            {isSaving ? "Saving\u2026" : "Save"}
          </button>
          <button
            onClick={() => setShowSavePopover(false)}
            className="text-[11px] text-arch-text3 hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-2 px-3 py-2 rounded-lg bg-arch-red/10 border border-arch-red/30 text-arch-red text-[11.5px]">
          {error}
        </div>
      )}

      {/* Live voice transcript bar */}
      {supported.recognition && showTranscriptBar && (
        <div className="mx-4 mt-2 px-3 py-2.5 rounded-lg bg-arch-bg2 border border-arch-coral/30 flex items-center gap-2.5">
          {listening && (
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-arch-coral opacity-60 animate-ping" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-arch-coral" />
            </span>
          )}
          <div className="flex-1 min-w-0 text-[12px] leading-snug">
            {transcript || interim ? (
              <span className="text-arch-text">
                {transcript}
                {interim && (
                  <span className="text-arch-text3 italic">
                    {transcript ? " " : ""}
                    {interim}
                  </span>
                )}
              </span>
            ) : (
              <span className="text-arch-text3 italic">Listening… speak your answer</span>
            )}
          </div>
          <button
            onClick={sendTranscript}
            disabled={!transcript.trim() || isStreaming}
            title="Send answer"
            className="flex items-center gap-1 text-[11px] text-arch-green hover:bg-arch-green/10 px-2 py-1 rounded transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-3 h-3" /> Send
          </button>
          <button
            onClick={clearTranscript}
            title="Discard transcript"
            className="text-arch-text3 hover:text-arch-red hover:bg-white/5 p-1 rounded transition-colors cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Messages area */}
      <div
        ref={scrollRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 ${isEmpty ? "flex flex-col items-center justify-center" : ""}`}
      >
        {isEmpty ? (
          <div className="w-full max-w-xl mx-auto flex flex-col gap-3">
            {voiceSupported && (
              <button
                onClick={startMockInterview}
                disabled={isStreaming}
                title="Start a spoken mock interview"
                className="self-center flex items-center gap-2 px-3.5 py-2 rounded-full text-[12px] font-medium text-white bg-gradient-to-r from-arch-purple to-arch-blue hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 shadow-sm"
              >
                <Mic className="w-3.5 h-3.5" />
                Start voice mock interview
              </button>
            )}
            <div className="flex flex-wrap items-center justify-center gap-1.5">
              {COACH_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="px-2.5 py-1 rounded-full text-[10.5px] text-arch-text3 border border-arch-border hover:border-arch-teal/40 hover:text-arch-teal transition-colors cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
            <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
          </div>
        ) : (
          <div className="flex flex-col gap-4 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        )}
      </div>

      {/* Input — only when conversation is active */}
      {!isEmpty && (
        <div className="max-w-3xl mx-auto w-full px-4 pb-4 pt-2">
          <ChatInput onSend={sendMessage} onStop={stopStreaming} isStreaming={isStreaming} />
        </div>
      )}
    </div>
  );
}
