const huggingFaceApiKey = "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"; // Replace with your Hugging Face API key

// Dark Mode Toggle (optional)
document.getElementById("darkModeToggle").addEventListener("change", (event) => {
  document.body.classList.toggle("dark-mode", event.target.checked);
});

// PDF Upload and Text Extraction
document.getElementById("pdfUpload").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file || file.type !== "application/pdf") {
    alert("Please upload a valid PDF file.");
    return;
  }

  document.getElementById("loading").classList.remove("d-none");
  document.getElementById("inputText").value = "Extracting text...";

  try {
    const pdfData = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;

    let extractedText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      extractedText += textContent.items.map((item) => item.str).join(" ") + "\n";
    }

    document.getElementById("inputText").value = extractedText;
    updateWordCount(extractedText); // Update word count after text extraction
  } catch (error) {
    alert("Failed to extract text from PDF: " + error.message);
  } finally {
    document.getElementById("loading").classList.add("d-none");
  }
});

// Update Word Count
function updateWordCount(text) {
  const wordCount = text.trim().split(/\s+/).length;
  document.getElementById("wordCount").textContent = `Word Count: ${wordCount}`;
}

// Summarize Text
document.getElementById("summarizeBtn").addEventListener("click", async () => {
  const text = document.getElementById("inputText").value;
  const language = document.getElementById("languageSelect").value;
  const length = document.getElementById("summaryLength").value;

  if (!text.trim()) {
    alert("Please enter text to summarize.");
    return;
  }

  document.getElementById("loading").classList.remove("d-none");
  document.getElementById("summaryOutput").textContent = "";

  try {
    const summary = await summarizeText(text, language, length);
    document.getElementById("summaryOutput").textContent = summary;
    updateWordCount(summary); // Update word count for the summary
  } catch (error) {
    alert("Error summarizing text: " + error.message);
  } finally {
    document.getElementById("loading").classList.add("d-none");
  }
});

// Download Summary
document.getElementById("downloadBtn").addEventListener("click", () => {
  const summary = document.getElementById("summaryOutput").textContent;
  if (!summary.trim()) {
    alert("No summary to download.");
    return;
  }

  const blob = new Blob([summary], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "summary.txt";
  link.click();
});

// Copy Summary
document.getElementById("copyBtn").addEventListener("click", () => {
  const summary = document.getElementById("summaryOutput").textContent;
  navigator.clipboard.writeText(summary).then(() => alert("Copied to clipboard!"));
});

// Summarization and Translation
async function summarizeText(text, language, length) {
  const models = {
    short: "facebook/bart-large-cnn",
    medium: "google/pegasus-large",
    detailed: "t5-large",
  };

  const response = await fetch(`https://api-inference.huggingface.co/models/${models[length]}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${huggingFaceApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  const data = await response.json();
  let summary = data[0]?.summary_text || "Could not generate summary.";

  if (language !== "en") {
    summary = await translateText(summary, language);
  }

  return summary;
}

async function translateText(text, targetLang) {
  const response = await fetch("https://libretranslate.com/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ q: text, target: targetLang }),
  });

  const data = await response.json();
  return data.translatedText || text;
}


   
