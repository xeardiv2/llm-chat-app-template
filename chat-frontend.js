// Código mínimo para manejar UI y llamadas a /api/chat
const openBtn = document.getElementById('openChatBtn');
const chatFab = document.getElementById('chatFab');
const chatWidget = document.getElementById('chatWidget');
const closeChat = document.getElementById('closeChat');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
document.getElementById('year').textContent = new Date().getFullYear();

function showChat(){ chatWidget.classList.remove('collapsed'); chatWidget.setAttribute('aria-hidden','false'); chatInput.focus(); }
function hideChat(){ chatWidget.classList.add('collapsed'); chatWidget.setAttribute('aria-hidden','true'); }

openBtn?.addEventListener('click', showChat);
chatFab?.addEventListener('click', showChat);
closeChat?.addEventListener('click', hideChat);

function appendMessage(text, who='bot'){
  const div = document.createElement('div');
  div.className = 'msg ' + (who==='user' ? 'user' : 'bot');
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  div.appendChild(bubble);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendToServer(message){
  appendMessage(message,'user');
  appendMessage('…','bot'); // placeholder
  try{
    const res = await fetch('/api/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message})
    });
    const data = await res.json();
    // remove the last placeholder bot message
    const placeholders = chatMessages.querySelectorAll('.msg.bot .bubble');
    if(placeholders.length) placeholders[placeholders.length-1].textContent = data.reply || 'No response';
  }catch(e){
    const placeholders = chatMessages.querySelectorAll('.msg.bot .bubble');
    if(placeholders.length) placeholders[placeholders.length-1].textContent = 'Error contactando el servidor';
  }
}

chatForm?.addEventListener('submit', (e)=>{
  e.preventDefault();
  const txt = chatInput.value.trim();
  if(!txt) return;
  chatInput.value = '';
  sendToServer(txt);
});
