"use client";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function AIAssistant({ accountId }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    const res = await fetch("/api/ai-analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, accountId }),
    });

    const data = await res.json();
    setAnswer(data.answer || "No response from AI.");
    setLoading(false);
  };

  return (
    <div className="p-4 mt-6 border rounded-xl bg-muted/30 space-y-3">
      <h2 className="text-xl font-semibold">💬 Ask AI about this account</h2>
      <Input
        placeholder="e.g. How much did I spend on food this month?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
      />
      <Button onClick={askAI} disabled={loading}>
        {loading ? "Thinking..." : "Ask AI"}
      </Button>
      {answer && (
        <div className="p-3 mt-2 bg-white border rounded shadow text-sm whitespace-pre-wrap">
          {answer}
        </div>
      )}
    </div>
  );
}
