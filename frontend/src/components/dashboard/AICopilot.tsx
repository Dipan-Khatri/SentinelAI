import {
  Bot,
  BrainCircuit,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  LoaderCircle,
  MessageSquareText,
  Send,
  ShieldAlert,
  Sparkles,
  Trash2,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { UploadResult } from "../../services/api";

type AICopilotProps = {
  analysis: UploadResult;
};

type ChatRole = "assistant" | "user";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: Date;
};

type SuggestedQuestion = {
  label: string;
  question: string;
};

const suggestedQuestions: SuggestedQuestion[] = [
  {
    label: "Explain incident",
    question: "Explain this incident in simple terms.",
  },
  {
    label: "Risk score",
    question: "Why is the risk score this high?",
  },
  {
    label: "Suspicious IP",
    question: "Which IP address is the most suspicious?",
  },
  {
    label: "MITRE technique",
    question: "What MITRE ATT&CK technique was detected?",
  },
  {
    label: "Recommended action",
    question: "What should the security analyst do next?",
  },
  {
    label: "Compromise status",
    question: "Was there a successful compromise?",
  },
];

function createMessageId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
}

function formatMessageTime(date: Date) {
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AICopilot({
  analysis,
}: AICopilotProps) {
  const [messages, setMessages] = useState<
    ChatMessage[]
  >(() => [
    {
      id: createMessageId(),
      role: "assistant",
      content: createWelcomeMessage(analysis),
      createdAt: new Date(),
    },
  ]);

  const [question, setQuestion] = useState("");
  const [isThinking, setIsThinking] =
    useState(false);

  const messageContainerRef =
    useRef<HTMLDivElement | null>(null);

  const topSuspiciousIp = useMemo(
    () =>
      [...analysis.suspicious_ips].sort(
        (firstIp, secondIp) =>
          secondIp.attempts -
          firstIp.attempts,
      )[0],
    [analysis.suspicious_ips],
  );

  useEffect(() => {
    const container =
      messageContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isThinking]);

  useEffect(() => {
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content: createWelcomeMessage(analysis),
        createdAt: new Date(),
      },
    ]);

    setQuestion("");
    setIsThinking(false);
  }, [analysis]);

  async function submitQuestion(
    userQuestion: string,
  ) {
    const cleanedQuestion =
      userQuestion.trim();

    if (!cleanedQuestion || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: cleanedQuestion,
      createdAt: new Date(),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      userMessage,
    ]);

    setQuestion("");
    setIsThinking(true);

    await new Promise<void>((resolve) => {
      window.setTimeout(resolve, 700);
    });

    const response = generateCopilotResponse(
      cleanedQuestion,
      analysis,
      topSuspiciousIp,
    );

    const assistantMessage: ChatMessage = {
      id: createMessageId(),
      role: "assistant",
      content: response,
      createdAt: new Date(),
    };

    setMessages((currentMessages) => [
      ...currentMessages,
      assistantMessage,
    ]);

    setIsThinking(false);
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    void submitQuestion(question);
  }

  function clearConversation() {
    setMessages([
      {
        id: createMessageId(),
        role: "assistant",
        content: createWelcomeMessage(analysis),
        createdAt: new Date(),
      },
    ]);

    setQuestion("");
  }

  return (
    <section className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-700 p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-purple-500/15 p-3">
            <BrainCircuit className="h-7 w-7 text-purple-400" />
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                Ask Sentinel
              </h2>

              <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300">
                <Sparkles className="h-3.5 w-3.5" />
                SOC Copilot
              </span>
            </div>

            <p className="mt-1 text-sm text-slate-400">
              Ask questions about the latest security
              analysis.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearConversation}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/60 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-slate-500 hover:bg-slate-900 hover:text-white"
        >
          <Trash2 className="h-4 w-4" />
          Clear Chat
        </button>
      </div>

      <div className="grid min-h-[620px] xl:grid-cols-[0.72fr_1.28fr]">
        <aside className="border-b border-slate-700 bg-slate-950/30 p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-blue-400" />

            <h3 className="font-semibold text-white">
              Suggested Questions
            </h3>
          </div>

          <div className="mt-4 space-y-3">
            {suggestedQuestions.map(
              (suggestion) => (
                <button
                  key={suggestion.question}
                  type="button"
                  disabled={isThinking}
                  onClick={() =>
                    void submitQuestion(
                      suggestion.question,
                    )
                  }
                  className="group flex w-full items-center justify-between gap-3 rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-left transition hover:border-blue-500/50 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-200">
                      {suggestion.label}
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {suggestion.question}
                    </p>
                  </div>

                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-blue-400" />
                </button>
              ),
            )}
          </div>

          <div className="mt-6 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />

              <div>
                <p className="text-sm font-semibold text-blue-200">
                  Analysis Context
                </p>

                <div className="mt-3 space-y-2 text-xs text-slate-300">
                  <ContextRow
                    label="File"
                    value={analysis.filename}
                  />

                  <ContextRow
                    label="Events"
                    value={analysis.entries.toLocaleString()}
                  />

                  <ContextRow
                    label="Risk"
                    value={`${analysis.risk_level} · ${analysis.risk_score}/100`}
                  />

                  <ContextRow
                    label="Detections"
                    value={analysis.detections.length.toLocaleString()}
                  />

                  <ContextRow
                    label="Suspicious IPs"
                    value={analysis.suspicious_ips.length.toLocaleString()}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-xs leading-5 text-slate-300">
              This version uses deterministic analysis
              logic. It does not send logs or security data
              to an external AI provider.
            </p>
          </div>
        </aside>

        <div className="flex min-h-[620px] flex-col">
          <div
            ref={messageContainerRef}
            className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
          >
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
              />
            ))}

            {isThinking && <ThinkingBubble />}
          </div>

          <form
            onSubmit={handleSubmit}
            className="border-t border-slate-700 bg-slate-900/50 p-4 sm:p-5"
          >
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label
                  htmlFor="sentinel-question"
                  className="sr-only"
                >
                  Ask Sentinel a question
                </label>

                <textarea
                  id="sentinel-question"
                  rows={2}
                  value={question}
                  disabled={isThinking}
                  onChange={(event) =>
                    setQuestion(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter" &&
                      !event.shiftKey
                    ) {
                      event.preventDefault();
                      void submitQuestion(
                        question,
                      );
                    }
                  }}
                  placeholder="Ask about the incident, risk score, suspicious IPs, MITRE techniques, or response actions..."
                  className="max-h-36 min-h-[54px] w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-600 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>

              <button
                type="submit"
                disabled={
                  isThinking ||
                  question.trim().length === 0
                }
                className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                aria-label="Send question"
              >
                {isThinking ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-slate-600">
              Press Enter to send. Use Shift + Enter for a
              new line.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}

type ChatBubbleProps = {
  message: ChatMessage;
};

function ChatBubble({
  message,
}: ChatBubbleProps) {
  const isAssistant =
    message.role === "assistant";

  return (
    <div
      className={`flex gap-3 ${
        isAssistant
          ? "justify-start"
          : "justify-end"
      }`}
    >
      {isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/15">
          <Bot className="h-5 w-5 text-purple-400" />
        </div>
      )}

      <div
        className={`max-w-[88%] rounded-2xl border px-4 py-3 sm:max-w-[78%] ${
          isAssistant
            ? "rounded-tl-sm border-slate-700 bg-slate-900/80"
            : "rounded-tr-sm border-blue-500/30 bg-blue-600"
        }`}
      >
        <div className="whitespace-pre-line text-sm leading-7 text-slate-100">
          {message.content}
        </div>

        <p
          className={`mt-2 text-[11px] ${
            isAssistant
              ? "text-slate-600"
              : "text-blue-200"
          }`}
        >
          {formatMessageTime(
            message.createdAt,
          )}
        </p>
      </div>

      {!isAssistant && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
          <CircleUserRound className="h-5 w-5 text-blue-300" />
        </div>
      )}
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-500/15">
        <Bot className="h-5 w-5 text-purple-400" />
      </div>

      <div className="rounded-2xl rounded-tl-sm border border-slate-700 bg-slate-900/80 px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.3s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400 [animation-delay:-0.15s]" />
          <span className="h-2 w-2 animate-bounce rounded-full bg-purple-400" />
        </div>
      </div>
    </div>
  );
}

type ContextRowProps = {
  label: string;
  value: string;
};

function ContextRow({
  label,
  value,
}: ContextRowProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-slate-500">
        {label}
      </span>

      <span className="max-w-[150px] break-words text-right font-medium text-slate-300">
        {value}
      </span>
    </div>
  );
}

type SuspiciousIp =
  UploadResult["suspicious_ips"][number];

function createWelcomeMessage(
  analysis: UploadResult,
) {
  return `I analyzed ${analysis.entries.toLocaleString()} security events from ${analysis.filename}.

The current incident is classified as ${analysis.risk_level.toLowerCase()} risk with a score of ${analysis.risk_score}/100. I can explain the incident, review suspicious IP addresses, describe MITRE ATT&CK mappings, or recommend analyst actions.`;
}

function generateCopilotResponse(
  question: string,
  analysis: UploadResult,
  topSuspiciousIp?: SuspiciousIp,
) {
  const normalizedQuestion =
    question.toLowerCase();

  if (
    containsAny(normalizedQuestion, [
      "hello",
      "hi ",
      "hey",
      "who are you",
      "what can you do",
    ])
  ) {
    return `I am SentinelAI's SOC Copilot. I answer questions using the latest uploaded security analysis.

You can ask me about:
• Incident explanation
• Risk score
• Suspicious IP addresses
• Authentication activity
• MITRE ATT&CK techniques
• Severity
• Recommended response actions`;
  }

  if (
    containsAny(normalizedQuestion, [
      "explain",
      "summary",
      "summarize",
      "what happened",
      "incident",
      "attack",
    ])
  ) {
    return buildIncidentExplanation(
      analysis,
      topSuspiciousIp,
    );
  }

  if (
    containsAny(normalizedQuestion, [
      "risk score",
      "why is the risk",
      "risk level",
      "score high",
      "score low",
      "score medium",
    ])
  ) {
    return buildRiskExplanation(
      analysis,
      topSuspiciousIp,
    );
  }

  if (
    containsAny(normalizedQuestion, [
      "suspicious ip",
      "most suspicious",
      "source ip",
      "ip address",
      "attacker ip",
      "highest ip",
    ])
  ) {
    return buildSuspiciousIpResponse(
      analysis,
      topSuspiciousIp,
    );
  }

  if (
    containsAny(normalizedQuestion, [
      "mitre",
      "technique",
      "tactic",
      "t1110",
      "attack framework",
    ])
  ) {
    return buildMitreResponse(analysis);
  }

  if (
    containsAny(normalizedQuestion, [
      "recommend",
      "what should",
      "next step",
      "respond",
      "response",
      "mitigation",
      "action",
      "block",
      "investigate",
    ])
  ) {
    return buildRecommendationResponse(
      analysis,
      topSuspiciousIp,
    );
  }

  if (
    containsAny(normalizedQuestion, [
      "successful compromise",
      "compromised",
      "successful login",
      "breach",
      "access gained",
      "logged in",
    ])
  ) {
    return buildCompromiseResponse(
      analysis,
    );
  }

  if (
    containsAny(normalizedQuestion, [
      "failed login",
      "authentication",
      "login activity",
      "success rate",
      "failure rate",
    ])
  ) {
    return buildAuthenticationResponse(
      analysis,
    );
  }

  if (
    containsAny(normalizedQuestion, [
      "severity",
      "critical",
      "high alert",
      "medium alert",
      "low alert",
    ])
  ) {
    return buildSeverityResponse(analysis);
  }

  if (
    containsAny(normalizedQuestion, [
      "detection",
      "alert",
      "rule matched",
    ])
  ) {
    return buildDetectionResponse(analysis);
  }

  if (
    containsAny(normalizedQuestion, [
      "file",
      "events processed",
      "how many events",
      "log file",
    ])
  ) {
    return `SentinelAI processed ${analysis.entries.toLocaleString()} events from ${analysis.filename}.

The analysis produced ${analysis.detections.length.toLocaleString()} detection(s), identified ${analysis.suspicious_ips.length.toLocaleString()} suspicious IP address(es), and assigned a risk score of ${analysis.risk_score}/100.`;
  }

  return buildFallbackResponse(analysis);
}

function containsAny(
  value: string,
  terms: string[],
) {
  return terms.some((term) =>
    value.includes(term),
  );
}

function buildIncidentExplanation(
  analysis: UploadResult,
  topSuspiciousIp?: SuspiciousIp,
) {
  const primaryDetection =
    analysis.detections[0];

  const sourceSentence = topSuspiciousIp
    ? `The most active suspicious source was ${topSuspiciousIp.ip}, which generated ${topSuspiciousIp.attempts.toLocaleString()} failed attempt(s).`
    : "No source IP exceeded the configured suspicious-activity threshold.";

  const detectionSentence =
    primaryDetection
      ? `The main detection was ${primaryDetection.type}, mapped to MITRE ATT&CK ${primaryDetection.mitre_id}, with ${primaryDetection.confidence}% confidence.`
      : "No detection rule produced a primary MITRE ATT&CK mapping.";

  return `SentinelAI analyzed ${analysis.entries.toLocaleString()} events from ${analysis.filename}.

It identified ${analysis.failed_logins.toLocaleString()} failed login attempt(s) and ${analysis.successful_logins.toLocaleString()} successful login attempt(s). ${sourceSentence}

${detectionSentence}

The incident is currently assessed as ${analysis.risk_level.toLowerCase()} risk with a score of ${analysis.risk_score}/100. This indicates suspicious authentication activity that should be validated by an analyst.`;
}

function buildRiskExplanation(
  analysis: UploadResult,
  topSuspiciousIp?: SuspiciousIp,
) {
  const factors: string[] = [];

  if (analysis.failed_logins > 0) {
    factors.push(
      `${analysis.failed_logins.toLocaleString()} failed login attempt(s)`,
    );
  }

  if (analysis.suspicious_ips.length > 0) {
    factors.push(
      `${analysis.suspicious_ips.length.toLocaleString()} suspicious source IP address(es)`,
    );
  }

  if (analysis.detections.length > 0) {
    factors.push(
      `${analysis.detections.length.toLocaleString()} detection(s)`,
    );
  }

  if (
    analysis.severity_summary.critical > 0 ||
    analysis.severity_summary.high > 0
  ) {
    factors.push(
      `${(
        analysis.severity_summary.critical +
        analysis.severity_summary.high
      ).toLocaleString()} critical or high-severity alert(s)`,
    );
  }

  if (topSuspiciousIp) {
    factors.push(
      `repeated activity from ${topSuspiciousIp.ip}`,
    );
  }

  const factorText =
    factors.length > 0
      ? factors
          .map(
            (factor, index) =>
              `${index + 1}. ${factor}`,
          )
          .join("\n")
      : "No major risk factors were identified.";

  return `The current score is ${analysis.risk_score}/100, classified as ${analysis.risk_level}.

The main contributing factors are:
${factorText}

The score represents the combined result of authentication failures, suspicious-source activity, detection severity, and MITRE-mapped behaviors. It should be treated as a prioritization aid rather than final proof of compromise.`;
}

function buildSuspiciousIpResponse(
  analysis: UploadResult,
  topSuspiciousIp?: SuspiciousIp,
) {
  if (!topSuspiciousIp) {
    return `No IP address exceeded the current suspicious-activity threshold.

SentinelAI processed ${analysis.entries.toLocaleString()} events, but no source produced enough repeated failures to be ranked as suspicious.`;
  }

  const rankedIps = [
    ...analysis.suspicious_ips,
  ]
    .sort(
      (firstIp, secondIp) =>
        secondIp.attempts -
        firstIp.attempts,
    )
    .slice(0, 5)
    .map(
      (item, index) =>
        `${index + 1}. ${item.ip} — ${item.attempts.toLocaleString()} failed attempt(s)`,
    )
    .join("\n");

  return `The most suspicious source is ${topSuspiciousIp.ip}.

It generated ${topSuspiciousIp.attempts.toLocaleString()} failed authentication attempt(s), which is the highest observed total in this analysis.

Ranked suspicious sources:
${rankedIps}

Recommended next step: review the complete activity timeline for this IP, identify targeted usernames, check for successful logins, and validate the IP using an external reputation provider before blocking it.`;
}

function buildMitreResponse(
  analysis: UploadResult,
) {
  if (analysis.detections.length === 0) {
    return "No MITRE ATT&CK technique was mapped in the latest analysis.";
  }

  const uniqueTechniques = Array.from(
    new Map(
      analysis.detections.map(
        (detection) => [
          detection.mitre_id,
          detection,
        ],
      ),
    ).values(),
  );

  const techniqueList = uniqueTechniques
    .map(
      (detection, index) =>
        `${index + 1}. ${detection.mitre_id} — ${detection.type}
Severity: ${detection.severity}
Confidence: ${detection.confidence}%`,
    )
    .join("\n\n");

  return `SentinelAI mapped the observed behavior to the following MITRE ATT&CK technique(s):

${techniqueList}

These mappings describe the attacker behavior detected in the logs. They help analysts organize findings and connect the incident to standard adversary techniques.`;
}

function buildRecommendationResponse(
  analysis: UploadResult,
  topSuspiciousIp?: SuspiciousIp,
) {
  const detectionRecommendation =
    analysis.detections
      .flatMap(
        (detection) =>
          detection.recommendations ?? [],
      )
      .find(
        (recommendation) =>
          recommendation.trim().length > 0,
      );

  const steps = [
    topSuspiciousIp
      ? `Review all events associated with ${topSuspiciousIp.ip}.`
      : "Review the source addresses associated with failed authentication activity.",
    "Identify the usernames and privileged accounts targeted by the activity.",
    "Check whether any successful login occurred after repeated failures.",
    "Validate suspicious IP addresses using an external threat-intelligence provider.",
    "Temporarily block or rate-limit confirmed malicious sources.",
    "Preserve relevant logs and create or update an investigation case.",
    "Reset affected credentials and require MFA when unauthorized access is suspected.",
  ];

  if (detectionRecommendation) {
    steps.unshift(detectionRecommendation);
  }

  return `Recommended analyst workflow:

${steps
  .map(
    (step, index) =>
      `${index + 1}. ${step}`,
  )
  .join("\n")}

Current priority: ${analysis.risk_level} risk, score ${analysis.risk_score}/100. Analyst validation is required before containment actions are finalized.`;
}

function buildCompromiseResponse(
  analysis: UploadResult,
) {
  if (analysis.successful_logins === 0) {
    return `SentinelAI did not observe a successful login in the analyzed data.

That lowers the evidence for a confirmed compromise, but it does not prove the environment is safe. The analyst should still verify whether the log source includes all authentication events and check for activity outside the uploaded time range.`;
  }

  return `The analysis contains ${analysis.successful_logins.toLocaleString()} successful login attempt(s).

This does not automatically confirm compromise because legitimate users may have authenticated successfully. However, the analyst should correlate successful logins with:

1. Suspicious source IP addresses
2. Repeated failures immediately before success
3. Privileged or unusual usernames
4. Unexpected login times or locations
5. Post-authentication activity

Until those events are validated, the compromise status should remain undetermined.`;
}

function buildAuthenticationResponse(
  analysis: UploadResult,
) {
  const totalAuthenticationEvents =
    analysis.failed_logins +
    analysis.successful_logins;

  const failureRate =
    totalAuthenticationEvents > 0
      ? Math.round(
          (analysis.failed_logins /
            totalAuthenticationEvents) *
            100,
        )
      : 0;

  const successRate =
    totalAuthenticationEvents > 0
      ? 100 - failureRate
      : 0;

  return `Authentication activity summary:

• Failed logins: ${analysis.failed_logins.toLocaleString()}
• Successful logins: ${analysis.successful_logins.toLocaleString()}
• Total authentication events: ${totalAuthenticationEvents.toLocaleString()}
• Failure rate: ${failureRate}%
• Success rate: ${successRate}%

A high failure rate can indicate brute-force activity, password spraying, misconfigured services, or legitimate users repeatedly entering incorrect credentials.`;
}

function buildSeverityResponse(
  analysis: UploadResult,
) {
  return `Alert severity distribution:

• Critical: ${analysis.severity_summary.critical.toLocaleString()}
• High: ${analysis.severity_summary.high.toLocaleString()}
• Medium: ${analysis.severity_summary.medium.toLocaleString()}
• Low: ${analysis.severity_summary.low.toLocaleString()}

The overall incident is classified as ${analysis.risk_level} risk with a score of ${analysis.risk_score}/100. Severity describes individual detections, while the risk score summarizes the incident as a whole.`;
}

function buildDetectionResponse(
  analysis: UploadResult,
) {
  if (analysis.detections.length === 0) {
    return "No detection rules matched the latest uploaded log.";
  }

  const detectionList =
    analysis.detections
      .slice(0, 8)
      .map(
        (detection, index) =>
          `${index + 1}. ${detection.type}
MITRE: ${detection.mitre_id}
Severity: ${detection.severity}
Confidence: ${detection.confidence}%`,
      )
      .join("\n\n");

  return `SentinelAI generated ${analysis.detections.length.toLocaleString()} detection(s):

${detectionList}`;
}

function buildFallbackResponse(
  analysis: UploadResult,
) {
  return `I could not match that question to a specific analysis category.

Try asking about:
• What happened in the incident
• Why the risk score is ${analysis.risk_score}
• The most suspicious IP address
• MITRE ATT&CK techniques
• Authentication failures
• Severity distribution
• Recommended analyst actions
• Whether a successful compromise occurred`;
}

export default AICopilot;
