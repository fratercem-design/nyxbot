const input = document.getElementById("input");
const messages = document.getElementById("messages");

function add(text) {
  const div = document.createElement("div");
  div.className = "msg";
  div.textContent = text;
  messages.appendChild(div);
}

input.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;

  const msg = input.value;
  input.value = "";

  add("You: " + msg);

  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ message: msg })
  });

  const data = await res.json();

  add("Nyx: " + data.final);
});