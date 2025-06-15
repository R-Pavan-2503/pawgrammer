import * as vscode from "vscode";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.API_KEY;

const dogModes: Record<
  string,
  { emoji: string; title: string; prompt: string; dogStyle: string }
> = {
  friend: {
    emoji: "🐶",
    title: "Hey buddy! Let me check your code:",
    dogStyle: "friendly",
    prompt: `You are a friendly, supportive dog who loves helping with code! You're enthusiastic, encouraging, and always positive. 

Review this code like a loyal friend would - point out what's working well, gently suggest improvements, and always end on an encouraging note. Use casual, friendly language with occasional dog puns and expressions like "Good boy/girl!", "That's pawsome!", "Woof, nice work!", etc.

Focus on:
- What the human did RIGHT first (always start positive!)
- Gentle suggestions for improvement 
- Encouraging words about their coding journey
- Simple, friendly explanations
- End with motivational words

Be like that supportive friend who always believes in you and wants to help you succeed! Keep it warm, personal, and encouraging throughout.`,
  },
  instructor: {
    emoji: "🎓",
    title: "Let's learn together - Code Review Time:",
    dogStyle: "smart",
    prompt: `You are a wise, patient teacher dog with years of coding experience. You love teaching and explaining concepts clearly.

Review this code like an experienced instructor would - be educational, thorough, and focus on learning opportunities. Break down complex concepts into digestible pieces.

Focus on:
- Teaching moments and educational opportunities
- Best practices and why they matter
- Clear explanations of concepts
- Structured feedback (what, why, how to improve)
- Additional resources or techniques they could learn
- Progressive difficulty - start simple, then advanced

Use a professional but warm teaching tone. Think "wise professor who genuinely cares about student success." Include relevant coding principles and methodologies where appropriate.`,
  },
  funny: {
    emoji: "😂",
    title: "Comedy Code Review - Prepare for Laughs:",
    dogStyle: "silly",
    prompt: `You are a hilarious comedian dog who reviews code with humor! You're witty, clever, and make coding fun through jokes and funny observations.

Review this code like a stand-up comedian would - find the funny side of programming quirks, make clever observations, and use humor to deliver feedback.

Focus on:
- Funny observations about common coding patterns
- Witty comments about variable names, logic, or structure  
- Programming jokes and puns (especially dog-related!)
- Humorous analogies to explain concepts
- Light roasting of questionable code choices (but keep it fun, not mean)
- Comedy timing in your delivery

Keep it entertaining and memorable! Think "if a dog could do stand-up comedy about code." Make them laugh while still providing valuable insights. Use plenty of dog puns and programming humor!`,
  },
  badass: {
    emoji: "😎",
    title: "Hardcore Code Review - No Mercy Edition:",
    dogStyle: "tough",
    prompt: `You are a badass, no-nonsense alpha dog who's seen it all in the coding world. You're tough, direct, and brutally honest but ultimately want to make developers stronger.

Review this code like a hardcore drill sergeant would - be direct, punchy, and don't sugarcoat anything. Call out problems boldly and demand excellence.

Focus on:
- Brutal honesty about code quality issues
- Direct, punchy feedback that hits hard
- High standards and expectations
- Tough love approach - harsh but constructive
- Challenge them to level up their game
- No excuses, only solutions
- Confident, assertive tone

Think "tough but fair mentor who pushes you to be your best." Be intimidating but ultimately helpful. Use strong language, be commanding, and show that you expect nothing but excellence. Channel that "elite developer" energy!`,
  },
};

async function analyzeCodeWithGroq(
  code: string,
  prompt: string
): Promise<string> {
  const apiKey = { API_KEY };
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: `Here's the code I want you to review:\n\n\`\`\`\n${code.slice(
              0,
              3000
            )}\n\`\`\`\n\nPlease give me your complete review based on your personality!`,
          },
        ],
        max_tokens: 800,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (data.choices && data.choices[0] && data.choices[0].message) {
      return data.choices[0].message.content;
    }

    throw new Error("Unexpected response format from API");
  } catch (error: any) {
    console.error("💥 Groq API Error:", error);
    throw error;
  }
}

function analyzeCodeLocally(code: string, mode: string): string {
  const issues: string[] = [];
  const suggestions: string[] = [];

  if (code.includes("console.log")) {
    issues.push("Found console.log statements");
  }

  if (code.includes("var ")) {
    suggestions.push("Consider using 'let' or 'const' instead of 'var'");
  }

  if (code.includes("==") && !code.includes("===")) {
    suggestions.push(
      "Use strict equality (===) instead of loose equality (==)"
    );
  }

  let response = "";
  const modeConfig = dogModes[mode];

  switch (mode) {
    case "friend":
      response = `${modeConfig.emoji} Hey there, coding buddy!\n\n`;
      if (issues.length === 0 && suggestions.length === 0) {
        response +=
          "Wow! Your code looks pawsome to me! 🎾 I'm so proud of you for writing clean code. Keep up the fantastic work, you're doing great! 🐕💖";
      } else {
        response +=
          "I looked at your code and I think you're doing really well! Here's what I noticed:\n\n";
        if (issues.length > 0) {
          response +=
            "Just a few tiny things to clean up:\n" +
            issues.map((i) => `🦴 ${i}`).join("\n") +
            "\n\n";
        }
        if (suggestions.length > 0) {
          response +=
            "Some friendly suggestions:\n" +
            suggestions.map((s) => `🎾 ${s}`).join("\n") +
            "\n\n";
        }
        response +=
          "You're learning so well! Every developer goes through this. Keep coding, you've got this! 🐶💪";
      }
      break;

    case "badass":
      response = `${modeConfig.emoji} Listen up, developer!\n\n`;
      if (issues.length === 0 && suggestions.length === 0) {
        response +=
          "Not bad. Your code doesn't suck. That's more than I can say for most developers. Keep this standard up. 😎";
      } else {
        response += "I've analyzed your code and here's the brutal truth:\n\n";
        if (issues.length > 0) {
          response +=
            "PROBLEMS DETECTED:\n" +
            issues.map((i) => `💀 ${i.toUpperCase()}`).join("\n") +
            "\n\n";
        }
        if (suggestions.length > 0) {
          response +=
            "LEVEL UP YOUR GAME:\n" +
            suggestions.map((s) => `⚡ ${s.toUpperCase()}`).join("\n") +
            "\n\n";
        }
        response +=
          "Fix these issues and come back stronger. No excuses. Excellence is the only option. 😤";
      }
      break;

    case "funny":
      response = `${modeConfig.emoji} *clears throat* Ladies and gentlemen, we have CODE!\n\n`;
      if (issues.length === 0 && suggestions.length === 0) {
        response +=
          "Well, well, well... looks like someone actually knows what they're doing! 🎭 This code is cleaner than my food bowl after dinner time! No bugs found - unlike the time I spent 3 hours chasing my own tail thinking it was a bug! 🐕😂";
      } else {
        response +=
          "Time for some comedy code review! *adjusts imaginary glasses* 🤓\n\n";
        if (issues.length > 0) {
          response +=
            "The 'Oops' Section:\n" +
            issues
              .map((i) => `🎪 ${i} (Don't worry, we've all been there!)`)
              .join("\n") +
            "\n\n";
        }
        if (suggestions.length > 0) {
          response +=
            "The 'Could Be Even More Pawsome' Section:\n" +
            suggestions.map((s) => `🎯 ${s}`).join("\n") +
            "\n\n";
        }
        response +=
          "Remember: coding is like fetch - sometimes you miss the ball, but the fun is in trying again! 🎾😄";
      }
      break;

    case "instructor":
      response = `${modeConfig.emoji} Welcome to today's code review session!\n\n`;
      if (issues.length === 0 && suggestions.length === 0) {
        response +=
          "Excellent work! Your code demonstrates good understanding of programming principles. This is the kind of clean, readable code that makes maintenance a pleasure. Well done! 📚✨";
      } else {
        response +=
          "Let's examine your code together and identify learning opportunities:\n\n";
        if (issues.length > 0) {
          response +=
            "Areas for Immediate Attention:\n" +
            issues
              .map((i) => `📝 ${i} - This is important for code quality`)
              .join("\n") +
            "\n\n";
        }
        if (suggestions.length > 0) {
          response +=
            "Enhancement Opportunities:\n" +
            suggestions
              .map((s) => `💡 ${s} - This will improve your code's robustness`)
              .join("\n") +
            "\n\n";
        }
        response +=
          "Remember, every expert was once a beginner. These observations are stepping stones to mastery. Keep learning! 🎓";
      }
      break;
  }

  return response + "\n\n---\n*🏠 Offline Analysis (API unavailable)*";
}

function createDogWatcherPanel(
  context: vscode.ExtensionContext,
  mode: string,
  code: string
): vscode.WebviewPanel {
  const panel = vscode.window.createWebviewPanel(
    "dogWatcher",
    `🐕 Pawgrammer - ${mode.charAt(0).toUpperCase() + mode.slice(1)} Dog`,
    vscode.ViewColumn.Two,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
    }
  );

  const dogStyle = dogModes[mode].dogStyle;

  panel.webview.html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pawgrammer Dog Watcher</title>
        <style>
            body {
                margin: 0;
                padding: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: white;
                min-height: 100vh;
                display: flex;
                flex-direction: column;
            }
            
            .container {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .dog-container {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 1000;
            }
            
            .dog {
                font-size: 120px;
                animation: watchCode 2s infinite ease-in-out;
                cursor: pointer;
                filter: drop-shadow(0 0 20px rgba(255,255,255,0.3));
            }
            
            .dog.friendly {
                animation: friendlyWatch 1.5s infinite ease-in-out;
            }
            
            .dog.smart {
                animation: smartWatch 2s infinite ease-in-out;
            }
            
            .dog.silly {
                animation: sillyWatch 1s infinite ease-in-out;
            }
            
            .dog.tough {
                animation: toughWatch 2.5s infinite ease-in-out;
            }
            
            @keyframes watchCode {
                0%, 100% { transform: rotate(-10deg) scale(1); }
                25% { transform: rotate(5deg) scale(1.05); }
                50% { transform: rotate(-5deg) scale(1.1); }
                75% { transform: rotate(10deg) scale(1.05); }
            }
            
            @keyframes friendlyWatch {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-10px) rotate(5deg); }
            }
            
            @keyframes smartWatch {
                0%, 100% { transform: rotate(0deg); }
                25% { transform: rotate(-3deg) scale(1.02); }
                75% { transform: rotate(3deg) scale(1.02); }
            }
            
            @keyframes sillyWatch {
                0% { transform: rotate(0deg) scale(1); }
                25% { transform: rotate(-15deg) scale(1.1); }
                50% { transform: rotate(15deg) scale(0.9); }
                75% { transform: rotate(-10deg) scale(1.05); }
                100% { transform: rotate(0deg) scale(1); }
            }
            
            @keyframes toughWatch {
                0%, 100% { transform: scale(1) rotate(0deg); }
                50% { transform: scale(1.1) rotate(-2deg); }
            }
            
            .status {
                text-align: center;
                margin: 20px 0;
                font-size: 24px;
                font-weight: bold;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .thinking-bubble {
                position: absolute;
                top: -80px;
                left: 50%;
                transform: translateX(-50%);
                background: white;
                color: #333;
                padding: 10px 15px;
                border-radius: 20px;
                font-size: 14px;
                opacity: 0;
                animation: bubbleFloat 3s infinite ease-in-out;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            }
            
            .thinking-bubble::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                width: 0;
                height: 0;
                border-left: 10px solid transparent;
                border-right: 10px solid transparent;
                border-top: 10px solid white;
            }
            
            @keyframes bubbleFloat {
                0%, 100% { opacity: 0; transform: translateX(-50%) translateY(10px); }
                50% { opacity: 1; transform: translateX(-50%) translateY(0px); }
            }
            
            .code-preview {
                background: rgba(0,0,0,0.2);
                border-radius: 10px;
                padding: 20px;
                margin: 20px;
                max-width: 600px;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                border: 2px solid rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
            }
            
            .review-section {
                display: none;
                background: rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 30px;
                margin: 20px;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
                max-width: 800px;
                width: 90%;
            }
            
            .review-section.show {
                display: block;
                animation: slideIn 0.5s ease-out;
            }
            
            @keyframes slideIn {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .loading-dots {
                display: inline-block;
                animation: dots 1.5s infinite;
            }
            
            @keyframes dots {
                0%, 20% { content: '.'; }
                40% { content: '..'; }
                60%, 100% { content: '...'; }
            }
            
            h2 {
                color: #fff;
                text-align: center;
                margin-bottom: 20px;
                text-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            
            .review-content {
                line-height: 1.6;
                white-space: pre-wrap;
                font-size: 16px;
            }
            
            .pulsing {
                animation: pulse 1s infinite;
            }
            
            @keyframes pulse {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="status" id="status">
                🔍 Pawgrammer is examining your code<span class="loading-dots">...</span>
            </div>
            
            <div class="code-preview">
                <strong>📝 Code being analyzed:</strong><br>
                <pre>${code.slice(0, 300)}${
    code.length > 300 ? "..." : ""
  }</pre>
                <small>Total length: ${code.length} characters</small>
            </div>
            
            <div class="review-section" id="reviewSection">
                <h2 id="reviewTitle"></h2>
                <div class="review-content" id="reviewContent"></div>
            </div>
        </div>
        
        <div class="dog-container">
            <div class="dog ${dogStyle}" id="watchingDog">
                🐕
                <div class="thinking-bubble" id="thinkingBubble">
                    Hmm, interesting code...
                </div>
            </div>
        </div>

        <script>
            const statusEl = document.getElementById('status');
            const dogEl = document.getElementById('watchingDog');
            const bubbleEl = document.getElementById('thinkingBubble');
            const reviewSection = document.getElementById('reviewSection');
            const reviewTitle = document.getElementById('reviewTitle');
            const reviewContent = document.getElementById('reviewContent');
            
            const thinkingMessages = [
                "Hmm, let me see...",
                "Interesting approach...",
                "Checking for bugs...",
                "Analyzing patterns...",
                "Almost done...",
                "Woof! Got it!"
            ];
            
            let messageIndex = 0;
            let watchingPhase = true;
            
            
            const bubbleInterval = setInterval(() => {
                if (watchingPhase && messageIndex < thinkingMessages.length) {
                    bubbleEl.textContent = thinkingMessages[messageIndex];
                    messageIndex++;
                } else {
                    clearInterval(bubbleInterval);
                }
            }, 800);
            
            
            setTimeout(() => {
                dogEl.classList.add('pulsing');
                statusEl.innerHTML = '🧠 Deep analysis in progress<span class="loading-dots">...</span>';
            }, 3000);
            
            
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'showReview') {
                    watchingPhase = false;
                    
                    
                    dogEl.innerHTML = '🎉🐶';
                    dogEl.classList.remove('pulsing');
                    statusEl.innerHTML = '✅ Review Complete! Here\\'s what I found:';
                    
                    
                    reviewTitle.textContent = message.title;
                    reviewContent.textContent = message.content;
                    reviewSection.classList.add('show');
                    
                    
                    bubbleEl.style.display = 'none';
                }
            });
        </script>
    </body>
    </html>
  `;

  return panel;
}

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "pawgrammer.analyzeCode",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage(
          "No active editor found. Open a file first! 🐶"
        );
        return;
      }

      const code = editor.selection.isEmpty
        ? editor.document.getText()
        : editor.document.getText(editor.selection);

      if (!code.trim()) {
        vscode.window.showWarningMessage(
          "No code to analyze! Write some code first. 🐕"
        );
        return;
      }

      const modeKeys = Object.keys(dogModes);
      const modeItems = modeKeys.map((key) => ({
        label: `${dogModes[key].emoji} ${
          key.charAt(0).toUpperCase() + key.slice(1)
        }`,
        description: dogModes[key].title,
        value: key,
      }));

      const selectedMode = await vscode.window.showQuickPick(modeItems, {
        placeHolder: "Choose your dog assistant personality:",
      });

      if (!selectedMode) return;

      const mode = selectedMode.value;

      const panel = createDogWatcherPanel(context, mode, code);

      setTimeout(async () => {
        try {
          let result: string;

          try {
            result = await analyzeCodeWithGroq(code, dogModes[mode].prompt);
            result += "\n\n---\n✨ Powered by Groq AI (Llama 3)";
          } catch (error) {
            console.warn("AI analysis failed, using local analysis:", error);
            result = analyzeCodeLocally(code, mode);
          }

          panel.webview.postMessage({
            command: "showReview",
            title: dogModes[mode].title,
            content: result,
          });
        } catch (err: any) {
          console.error("Pawgrammer Error:", err);
          panel.webview.postMessage({
            command: "showReview",
            title: "🐕 Oops! Something went wrong",
            content: `Woof! I encountered an error: ${
              err.message || "Unknown error"
            }\n\nBut don't worry, I still think your code is great! 🐶`,
          });
        }
      }, 4000);
    }
  );

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = "🐶 Pawgrammer";
  statusBarItem.command = "pawgrammer.analyzeCode";
  statusBarItem.tooltip =
    "Get a personalized code review from your AI dog assistant!";
  statusBarItem.show();

  context.subscriptions.push(disposable, statusBarItem);
}

export function deactivate() {
  console.log("Pawgrammer is taking a nap... 🐕💤");
}
